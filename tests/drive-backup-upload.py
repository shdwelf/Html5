#!/usr/bin/env python3
"""Transport controls only. No network access or real upload credentials."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("upload", Path(__file__).resolve().parents[1] / "scripts/upload-encrypted-drive-backups.py")
upload = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upload)
REVISION, FINGERPRINT = "a" * 40, "B" * 40
FILE_ID = "synthetic_drive_file_12345"


class Response(io.BytesIO):
    def __init__(self, headers, body=b"", status=200):
        super().__init__(body)
        self.headers, self.status = headers, status


class Client:
    def __init__(self, responses):
        self.responses, self.calls = iter(responses), []

    def open(self, request, timeout):
        self.calls.append(request)
        return next(self.responses)


class Controls(unittest.TestCase):
    def test_header_state_controls_chunk_completion_even_for_http_200(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(upload, "CHUNK_BYTES", 256 * 1024):
            path = Path(directory) / "synthetic.apk.gpg"
            payload = b"x" * (512 * 1024 + 17)
            path.write_bytes(payload)
            client = Client([
                Response({"X-Goog-Upload-Status": "active", "X-Goog-Upload-Size-Received": str(256 * 1024)}),
                Response({"X-Goog-Upload-Status": "active", "X-Goog-Upload-Size-Received": str(512 * 1024)}),
                Response({"X-Goog-Upload-Status": "final"}, json.dumps({"id": FILE_ID}).encode()),
            ])
            self.assertEqual(upload.upload(path, "https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic", client), {"id": FILE_ID})
            self.assertEqual(b"".join(request.data for request in client.calls), payload)
            self.assertEqual([int(request.get_header("X-goog-upload-offset")) for request in client.calls], [0, 256 * 1024, 512 * 1024])
            self.assertEqual(client.calls[-1].get_header("X-goog-upload-command"), "upload, finalize")
            self.assertTrue(all(request.get_header("Authorization") is None for request in client.calls))

    def test_premature_final_wrong_offset_or_bare_success_is_not_confirmation(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(upload, "CHUNK_BYTES", 256 * 1024):
            path = Path(directory) / "synthetic.apk.gpg"
            path.write_bytes(b"x" * (256 * 1024 + 1))
            for response in [
                Response({"X-Goog-Upload-Status": "final"}, json.dumps({"id": FILE_ID}).encode()),
                Response({"X-Goog-Upload-Status": "active", "X-Goog-Upload-Size-Received": "12"}),
                Response({}),
            ]:
                with self.assertRaises(RuntimeError):
                    upload.upload(path, "https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic", Client([response]))
            path.write_bytes(b"small synthetic ciphertext")
            for body in [b"{}", b"", b'{"id":"bad"}']:
                with self.assertRaises((RuntimeError, ValueError)):
                    upload.upload(path, "https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic", Client([Response({"X-Goog-Upload-Status": "final"}, body)]))

    def test_standard_drive_content_range_requires_exact_range_and_final_id(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(upload, "CHUNK_BYTES", 256 * 1024):
            path = Path(directory) / "synthetic.apk.gpg"
            path.write_bytes(b"x" * (256 * 1024 + 3))
            client = Client([
                Response({"Range": f"bytes=0-{256 * 1024 - 1}"}, status=308),
                Response({}, json.dumps({"id": FILE_ID}).encode(), status=200),
            ])
            self.assertEqual(upload.upload(path, "https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic", client)["id"], FILE_ID)

    def test_all_profiles_and_ciphertext_hashes_are_checked_before_any_network_io(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sessions = {"schema": 1, "sourceRevision": REVISION, "profiles": {}}
            for profile in upload.PROFILES:
                path = root / f"app-{profile}-debug.apk.gpg"
                path.write_bytes(b"synthetic transport control only")
                receipt = {"sourceRevision": REVISION, "recipientFingerprint": FINGERPRINT, "file": path.name, "ciphertext": upload.digests(path)}
                Path(f"{path}.json").write_text(json.dumps(receipt))
                sessions["profiles"][profile] = {"fileName": f"html5-{profile}-debug.apk.gpg", "sessionUri": f"https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic_{profile}"}
            self.assertEqual(len(upload.prepare(json.dumps(sessions), root, REVISION, FINGERPRINT)), 3)
            for uri in ["http://www.googleapis.com/upload/drive/v3/files?upload_id=x", "https://evil.invalid/upload/drive/v3/files?upload_id=x", "https://www.googleapis.com/unscoped", "https://user:secret@www.googleapis.com/upload/drive/v3/files?upload_id=x"]:
                changed = json.loads(json.dumps(sessions))
                changed["profiles"]["private"]["sessionUri"] = uri
                with self.assertRaises(ValueError):
                    upload.prepare(json.dumps(changed), root, REVISION, FINGERPRINT)
            with self.assertRaises(ValueError):
                upload.prepare(json.dumps(sessions), root, "c" * 40, FINGERPRINT)
            with self.assertRaises(ValueError):
                upload.prepare(json.dumps(sessions), root, REVISION, "C" * 40)
            (root / "app-private-debug.apk.gpg").write_bytes(b"changed")
            with self.assertRaises(ValueError):
                upload.prepare(json.dumps(sessions), root, REVISION, FINGERPRINT)

    def test_v6_full_recipient_fingerprint_is_supported_without_relaxing_revision_or_digest_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            root, fingerprint = Path(directory), "B" * 64
            sessions = {"schema": 1, "sourceRevision": REVISION, "profiles": {}}
            for profile in upload.PROFILES:
                path = root / f"app-{profile}-debug.apk.gpg"
                path.write_bytes(b"synthetic v6 ciphertext transport control only")
                receipt = {"sourceRevision": REVISION, "recipientFingerprint": fingerprint, "file": path.name, "ciphertext": upload.digests(path)}
                Path(f"{path}.json").write_text(json.dumps(receipt))
                sessions["profiles"][profile] = {"fileName": f"html5-{profile}-debug.apk.gpg", "sessionUri": f"https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic_{profile}"}
            self.assertEqual(len(upload.prepare(json.dumps(sessions), root, REVISION, fingerprint)), 3)
            for invalid in ["B" * 16, "B" * 63, "B" * 65, "G" * 64, "b" * 64]:
                with self.assertRaises(ValueError):
                    upload.prepare(json.dumps(sessions), root, REVISION, invalid)
            with self.assertRaises(ValueError):
                upload.prepare(json.dumps(sessions), root, "a" * 64, fingerprint)
            (root / "app-private-debug.apk.gpg").write_bytes(b"changed")
            with self.assertRaises(ValueError):
                upload.prepare(json.dumps(sessions), root, REVISION, fingerprint)

    def test_redirects_are_never_followed(self):
        with self.assertRaises(RuntimeError):
            upload.NoRedirect().redirect_request(None, None, 302, "redirect", {}, "https://evil.invalid/")


if __name__ == "__main__":
    unittest.main()
