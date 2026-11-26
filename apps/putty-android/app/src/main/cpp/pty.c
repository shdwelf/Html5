/* Private PTY and child lifecycle only. SSH and cryptography are PuTTY/Plink.
 * No shell command construction. Passwords cross the PTY, never argv/env/files.
 */
#define _GNU_SOURCE
#include <jni.h>
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <termios.h>
#include <time.h>
#include <unistd.h>

static void fail(JNIEnv *env, const char *message) {
    jclass exception = (*env)->FindClass(env, "java/io/IOException");
    if (exception) (*env)->ThrowNew(env, exception, message);
}

JNIEXPORT jintArray JNICALL
Java_org_html5_putty_NativePty_spawn(JNIEnv *env, jclass type, jstring binary,
                                   jstring home, jobjectArray arguments) {
    (void)type;
    int master = -1, slave = -1, report[2] = {-1, -1};
    char slave_name[256];
    pid_t pid = -1;
    const char *path = NULL, *dir = NULL;
    char **argv = NULL;
    jsize count = (*env)->GetArrayLength(env, arguments);
    if (count < 1 || count > 24) { fail(env, "Invalid argument count"); return NULL; }
    path = (*env)->GetStringUTFChars(env, binary, NULL);
    dir = (*env)->GetStringUTFChars(env, home, NULL);
    if (!path || !dir) goto cleanup;
    argv = calloc((size_t)count + 2, sizeof(char *));
    if (!argv) goto error;
    argv[0] = strdup(path);
    if (!argv[0]) goto error;
    for (jsize i = 0; i < count; i++) {
        jstring arg = (jstring)(*env)->GetObjectArrayElement(env, arguments, i);
        if (!arg) goto error;
        const char *value = (*env)->GetStringUTFChars(env, arg, NULL);
        if (!value) { (*env)->DeleteLocalRef(env, arg); goto cleanup; }
        argv[i+1] = strdup(value);
        (*env)->ReleaseStringUTFChars(env, arg, value);
        (*env)->DeleteLocalRef(env, arg);
        if (!argv[i+1]) goto error;
    }
    master = open("/dev/ptmx", O_RDWR | O_NOCTTY | O_CLOEXEC);
    if (master < 0 || grantpt(master) || unlockpt(master) ||
        ptsname_r(master, slave_name, sizeof(slave_name))) goto error;
    slave = open(slave_name, O_RDWR | O_NOCTTY | O_CLOEXEC);
    if (slave < 0 || pipe2(report, O_CLOEXEC)) goto error;
    struct termios attrs;
    if (tcgetattr(slave, &attrs)) goto error;
    /* Do not allow the PTY to echo secrets even before Plink reads a prompt.
     * Plink subsequently manages raw/canonical mode for its own console. */
    attrs.c_lflag &= ~(ECHO | ECHONL);
    if (tcsetattr(slave, TCSANOW, &attrs)) goto error;
    struct winsize size = {.ws_row = 32, .ws_col = 100};
    if (ioctl(slave, TIOCSWINSZ, &size)) goto error;
    /* Allocate the complete minimal environment BEFORE fork (Android JVM is
     * multithreaded); child uses only async-signal-safe operations then exec. */
    size_t dirlen = strlen(dir);
    char *home_env = malloc(dirlen + 6);
    if (!home_env) goto error;
    memcpy(home_env, "HOME=", 5); memcpy(home_env + 5, dir, dirlen + 1);
    char *child_env[] = {home_env, "TERM=dumb", "LANG=C.UTF-8", "PATH=/system/bin", NULL};
    pid = fork();
    if (pid == 0) {
        int err = 0;
        close(master); close(report[0]);
        if (setsid() < 0 || ioctl(slave, TIOCSCTTY, 0) < 0 ||
            dup2(slave, STDIN_FILENO) < 0 || dup2(slave, STDOUT_FILENO) < 0 ||
            dup2(slave, STDERR_FILENO) < 0 || chdir(dir) < 0) {
            err = errno;
        } else {
            if (slave > STDERR_FILENO) close(slave);
            execve(path, argv, child_env);
            err = errno;
        }
        (void)!write(report[1], &err, sizeof(err));
        _exit(127);
    }
    free(home_env);
    close(slave); slave = -1;
    close(report[1]); report[1] = -1;
    if (pid < 0) goto error;
    int child_error = 0;
    ssize_t n;
    do { n = read(report[0], &child_error, sizeof(child_error)); } while (n < 0 && errno == EINTR);
    close(report[0]); report[0] = -1;
    if (n != 0) {
        kill(pid, SIGKILL); (void)waitpid(pid, NULL, 0);
        pid = -1; goto error;
    }
    jint result[2] = {master, (jint)pid};
    jintArray output = (*env)->NewIntArray(env, 2);
    if (!output) {
        kill(pid, SIGKILL); (void)waitpid(pid, NULL, 0); goto cleanup;
    }
    (*env)->SetIntArrayRegion(env, output, 0, 2, result);
    master = -1;
    for (jsize i = 0; i <= count; i++) free(argv[i]);
    free(argv);
    (*env)->ReleaseStringUTFChars(env, binary, path);
    (*env)->ReleaseStringUTFChars(env, home, dir);
    return output;
error:
    fail(env, "Cannot start packaged Plink PTY");
cleanup:
    if (master >= 0) close(master);
    if (slave >= 0) close(slave);
    if (report[0] >= 0) close(report[0]);
    if (report[1] >= 0) close(report[1]);
    if (argv) { for (jsize i = 0; i <= count; i++) free(argv[i]); free(argv); }
    if (path) (*env)->ReleaseStringUTFChars(env, binary, path);
    if (dir) (*env)->ReleaseStringUTFChars(env, home, dir);
    return NULL;
}

JNIEXPORT jint JNICALL
Java_org_html5_putty_NativePty_waitFor(JNIEnv *env, jclass type, jint child) {
    (void)env; (void)type;
    if (child <= 1) return -1;
    int status = 0;
    pid_t result = 0;
    /* Called AFTER PTY EOF: allow normal exit rather than racing it with a
     * SIGKILL. Bound cleanup if a child closed its terminal but stayed alive. */
    struct timespec pause = {.tv_sec = 0, .tv_nsec = 10000000};
    for (int attempt = 0; attempt < 300; attempt++) {
        result = waitpid(child, &status, WNOHANG);
        if (result == child || (result < 0 && errno != EINTR)) break;
        (void)nanosleep(&pause, NULL);
    }
    if (result == 0 || (result < 0 && errno == EINTR)) {
        (void)kill(-child, SIGKILL); (void)kill(child, SIGKILL);
        do { result = waitpid(child, &status, 0); } while (result < 0 && errno == EINTR);
    }
    return result < 0 ? -1 : WIFEXITED(status) ? WEXITSTATUS(status) : 128 + WTERMSIG(status);
}

JNIEXPORT void JNICALL
Java_org_html5_putty_NativePty_terminate(JNIEnv *env, jclass type, jint child) {
    (void)env; (void)type;
    if (child > 1) { (void)kill(-child, SIGKILL); (void)kill(child, SIGKILL); }
}
