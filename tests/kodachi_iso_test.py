"""Offline acquisition controls: synthetic bytes only, no ISO/network/boot."""
import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('kodachi_fetch', Path(__file__).resolve().parents[1] / 'tools/kodachi/fetch-iso.py')
fetcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetcher)


class Response(io.BytesIO):
    def __init__(self, value, url='https://kodachi.cloud/downloads/file', length=None):
        super().__init__(value)
        self.url, self.headers = url, {} if length is None else {'Content-Length': length}

    def geturl(self):
        return self.url


class Opener:
    def __init__(self, value, **kwargs):
        self.value, self.kwargs = value, kwargs

    def open(self, request, timeout):
        assert request.headers['Accept-encoding'] == 'identity'
        assert timeout == 120
        return Response(self.value, **self.kwargs)


class AcquisitionTests(unittest.TestCase):
    def test_only_https_publisher_origin_and_port(self):
        for url in ['http://kodachi.cloud/file', 'https://kodachi.cloud.evil.invalid/file', 'https://user@kodachi.cloud/file', 'https://127.0.0.1/file', 'file:///tmp/a', 'https://kodachi.cloud:444/file', 'https://kodachi.cloud/a#frag']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                fetcher.checked_url(url)
        self.assertEqual(fetcher.checked_url(fetcher.URL), fetcher.URL)

    def test_size_and_sha_pins_have_exact_shapes(self):
        self.assertEqual(fetcher.EXPECTED_BYTES, 4544303104)
        self.assertRegex(fetcher.EXPECTED_SHA256, r'^[0-9a-f]{64}$')
        self.assertRegex(fetcher.EXPECTED_SHA512, r'^[0-9a-f]{128}$')

    def test_stream_hashes_final_url_and_no_execution(self):
        data = b'synthetic ISO-like bytes, never an executable image'
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'control.iso'
            receipt = fetcher.fetch(fetcher.URL, p, len(data), len(data), Opener(data, length=str(len(data))))
            self.assertEqual(p.read_bytes(), data)
            self.assertEqual(receipt['sha256'], hashlib.sha256(data).hexdigest())
            self.assertEqual(receipt['sha512'], hashlib.sha512(data).hexdigest())
            self.assertEqual(receipt['bytes'], len(data))

    def test_oversize_truncation_and_redirects_leave_no_output(self):
        for value, limit, expected, kwargs in [(b'abcd', 3, None, {}), (b'a', 5, 5, {}), (b'', 5, None, {}), (b'ab', 3, None, {'length': '999'}), (b'ab', 3, 2, {'length': '1'}), (b'ab', 3, None, {'url': 'https://evil.invalid/x'})]:
            with self.subTest(value=value, limit=limit, kwargs=kwargs), tempfile.TemporaryDirectory() as directory:
                p = Path(directory) / 'control.iso'
                with self.assertRaises(ValueError):
                    fetcher.fetch(fetcher.URL, p, limit, expected, Opener(value, **kwargs))
                self.assertEqual(list(Path(directory).iterdir()), [])

    def test_refuses_nonempty_destination_before_network(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory)
            (p / 'keep').write_text('preserved')
            with self.assertRaisesRegex(ValueError, 'fresh output directory'):
                fetcher.main(p)
            self.assertEqual((p / 'keep').read_text(), 'preserved')


if __name__ == '__main__':
    unittest.main()
