# Token USB Driver Installation Guide (Windows XP)

Supported platforms: Windows XP, Windows 2000.

## Logon integration

The driver installs a custom GINA so that the token can be used at the logon
screen. The installer writes:

    HKLM,SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon,GinaDLL,,"wbgina.dll"

After installing, reboot. The token will be available at logon.

## Service installation

    [WbTokenService]
    StartType = 0x3
    ServiceBinary = %12%\wbtoksvc.sys
