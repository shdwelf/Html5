package org.html5.putty;

import android.view.WindowManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.lang.reflect.Field;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public final class ActivitySafetyTest {
    @SuppressWarnings("unchecked")
    private static <T> T field(MainActivity activity, String name) {
        try {
            Field field = MainActivity.class.getDeclaredField(name);
            field.setAccessible(true);
            return (T)field.get(activity);
        } catch (ReflectiveOperationException failure) { throw new AssertionError(failure); }
    }

    @Test public void launchDefaultsDoNotConnectAndMaskInput() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                assertNotEquals(0, activity.getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE);
                assertNull(field(activity, "session"));
                assertTrue(ActivitySafetyTest.<CheckBox>field(activity, "masked").isChecked());
                assertFalse(ActivitySafetyTest.<Button>field(activity, "send").isEnabled());
                assertEquals("", ActivitySafetyTest.<EditText>field(activity, "username").getText().toString());
                assertEquals("", ActivitySafetyTest.<EditText>field(activity, "fingerprint").getText().toString());
                assertFalse(ActivitySafetyTest.<EditText>field(activity, "input").isSaveEnabled());
                assertTrue(ActivitySafetyTest.<TextView>field(activity, "status").getText().toString().contains("No account has been validated"));
            });
        }
    }

    @Test public void togglingMaskClearsExistingSecret() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                EditText input = field(activity, "input");
                input.setText("synthetic-unsent-secret");
                ActivitySafetyTest.<CheckBox>field(activity, "masked").setChecked(false);
                assertEquals("", input.getText().toString());
            });
        }
    }

    @Test public void backgroundAndRecreationDoNotRestoreInputOrOutput() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                ActivitySafetyTest.<EditText>field(activity, "input").setText("synthetic-unsent-secret");
                ActivitySafetyTest.<TextView>field(activity, "display").setText("synthetic-transcript");
            });
            scenario.moveToState(Lifecycle.State.CREATED);
            scenario.moveToState(Lifecycle.State.RESUMED);
            scenario.onActivity(activity -> {
                assertEquals("", ActivitySafetyTest.<EditText>field(activity, "input").getText().toString());
                assertEquals("", ActivitySafetyTest.<TextView>field(activity, "display").getText().toString());
                assertNull(field(activity, "session"));
            });
            scenario.recreate();
            scenario.onActivity(activity -> {
                assertEquals("", ActivitySafetyTest.<EditText>field(activity, "input").getText().toString());
                assertEquals("", ActivitySafetyTest.<TextView>field(activity, "display").getText().toString());
                assertNull(field(activity, "session"));
            });
        }
    }
}
