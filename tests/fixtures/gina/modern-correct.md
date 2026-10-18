# Token Driver Installation Guide (Windows 10)

Supported platforms: Windows 10/11, Windows 7, Windows Vista.

The GINA mechanism described in the appendix applies only to Windows XP and
earlier. On Windows Vista and later, GINA DLLs are ignored; logon is handled by
a Credential Provider registered under:

    HKLM\Software\Microsoft\Windows\CurrentVersion\Authentication\CredentialProviders

A smart card minidriver is installed so that no CSP middleware is required.

Enforcement uses the scforceoption policy value.

## Appendix: legacy GINA (pre-Vista only)

Custom GINA wbgina.dll, with fallback to MSGINA.DLL if logon fails.
Mandatory exports implemented: WlxNegotiate, WlxInitialize, WlxActivateUserShell,
WlxDisplaySASNotice, WlxLoggedOutSAS, WlxLoggedOnSAS, WlxWkstaLockedSAS,
WlxLogoff, WlxShutdown.

    StartType = 0x1
