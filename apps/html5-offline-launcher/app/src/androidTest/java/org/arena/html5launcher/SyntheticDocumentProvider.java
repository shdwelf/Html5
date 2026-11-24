package org.arena.html5launcher;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Instrumentation APK only; fixed throwaway documents, no arbitrary paths. */
public final class SyntheticDocumentProvider extends ContentProvider {
    @Override public boolean onCreate() { return true; }

    private File document(Uri uri) throws FileNotFoundException {
        String name = uri.getLastPathSegment();
        if (!"export.asc".equals(name) && !"import.asc".equals(name) &&
                !"corrupt.asc".equals(name) && !"denied.asc".equals(name)) throw new FileNotFoundException();
        File directory = new File(getContext().getCacheDir(), "synthetic-picker-documents");
        if (!directory.isDirectory() && !directory.mkdirs()) throw new FileNotFoundException();
        return new File(directory, name);
    }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File file = document(uri);
        if ("denied.asc".equals(file.getName())) throw new FileNotFoundException("Synthetic provider write refusal");
        if ("corrupt.asc".equals(file.getName()) && "r".equals(mode)) {
            try (FileOutputStream output = new FileOutputStream(file)) {
                output.write("Synthetic changed bytes for read-back rejection".getBytes(StandardCharsets.UTF_8));
            } catch (IOException failure) { throw new FileNotFoundException("Synthetic read failure"); }
        }
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.parseMode(mode));
    }
    @Override public String getType(Uri uri) { return "application/pgp-keys"; }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        try {
            File file = document(uri);
            String[] columns = projection == null ? new String[] { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE } : projection;
            MatrixCursor cursor = new MatrixCursor(columns);
            MatrixCursor.RowBuilder row = cursor.newRow();
            for (String column : columns) {
                if (OpenableColumns.DISPLAY_NAME.equals(column)) row.add(file.getName());
                else if (OpenableColumns.SIZE.equals(column)) row.add(file.length());
                else row.add(null);
            }
            return cursor;
        } catch (FileNotFoundException failure) { return null; }
    }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) {
        try { return document(uri).delete() ? 1 : 0; } catch (FileNotFoundException failure) { return 0; }
    }
}
