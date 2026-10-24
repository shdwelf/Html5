echo off
cls

if "%1" == "" goto NEEDDRIVE
if %1 == c: goto MKDIR
if %1 == C: goto MKDIR
if %1 == d: goto MKDIR
if %1 == D: goto MKDIR
if %1 == e: goto MKDIR
if %1 == E: goto MKDIR
if %1 == f: goto MKDIR
if %1 == F: goto MKDIR
if %1 == g: goto MKDIR
if %1 == G: goto MKDIR
if %1 == h: goto MKDIR
if %1 == H: goto MKDIR
if %1 == i: goto MKDIR
if %1 == I: goto MKDIR

:INVALID
echo "%1" is an invalid drive name.  Please enter your startup drive's 
echo letter followed by a colon":" 
echo For example:
goto Example

:NEEDDRIVE
echo Please specify your startup drive to install MOUSE, for example:
goto Example

:EXAMPLE
echo 
echo         install c:
goto End

:MKDIR
cls
echo ษออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออป
echo บ                                                                    บ
echo บ                   Super Mouse(TM) Installation                     บ
echo บ                                                                    บ
echo บ                                                                    บ
echo บ  This program will install the mouse drivers and pop-up menus      บ
echo บ  into a directory called "Mouse" on your startup drive %1.         บ 
echo บ  If you do not wish to do this press Ctrl-C now.                   บ
echo บ  Please refer to your user's guide for manual installation.        บ
echo บ                                                                    บ
echo ศออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออผ
echo 
pause
echo 

if exist %1\mouse\*.* goto DIREXIST
mkdir %1\mouse
goto COPYFILES

:DIREXIST
echo WARNING:  The directory %1\MOUSE already exists.  Press Ctrl-C
echo           now if you don't want to overwrite the contents of
echo           that directory.
echo 
pause
echo 

:COPYFILES
echo Copying diagnostic files to %1\MOUSE...
copy \mouse %1\mouse >nul
echo Copying Mouse drivers to %1\MOUSE...
copy \*.* %1\mouse >nul
\menu\zmenu %1\mouse

if not exist %1\mouse\mouse.com goto InstallError
if not exist %1\mouse\mouse.sys goto InstallError

cls
echo ษออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออป
echo บ                                                                      บ
echo บ     MOUSE has been successfully installed onto your hard disk.       บ
echo บ     Your autoexec.bat file will be updated. If you don't want        บ
echo บ     INSTALL to modify your autoexec.bat file press Ctrl-C now.       บ
echo บ                                                                      บ
echo ศออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออผ
pause
echo Updating AUTOEXEC.BAT.....
%1
cd\
if not exist autoexec.bat goto NoAutoexec
copy autoexec.bat + %1\mouse\mouse.bat temp.bat > NUL
del autoexec.bat
ren temp.bat autoexec.bat

echo ษออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออป
echo บ                                                                      บ
echo บ     Please reboot your computer.  The autoexec.bat file will         บ
echo บ     install the mouse driver for you.                                บ
echo บ     You should run the TEST program to test your mouse.              บ
echo บ                                                                      บ
echo ศออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออผ
pause
goto End

:NOAUTOEXEC
echo Your root directory does not contain the batch file AUTOEXEC.BAT. 
echo This file is executed by DOS when you power up your computer.  Please 
echo consult your DOS manual for information on how to create one. 
echo 
goto END

:INSTALLERROR
echo ERROR: Installation of MOUSE into %1\MOUSE was unsuccessful.
echo        The mouse drivers were not copied to your startup 
echo	       drive %1. This might be because %1 is full. 
echo        Mouse drivers need at least 34K of free disk space 

:End
echo 
