The mouse drivers MOUSE.COM and MOUSE.SYS version 7.04 are
multi-format drivers that support all of the versions of the Super
Mouse.  The mouse version and mouse port selection is automatic.
However, you can add command-line options to force MOUSE to install
a driver for the type of mouse you have. 

This document includes six sections :
 
1. Automatic Installation
2. Manual Installation
3. Turning off the mouse driver
4. Mouse driver command-line options
5. Mouse driver scaling factors
6. 3-Button Super Mouse usage

1. Automatic Installation:

Run the file INSTALL.BAT from your setup disk if you want the
install to copy the mouse drivers and mouse menus to your startup
disk.  The AUTOEXEC.BAT file on your startup disk will also be
modified to load the mouse driver when you start your computer.  To
run the installation program, put your mouse setup disk in drive A
of your computer.  At the DOS prompt, type:
                                                                  
      A:[RETURN]
      INSTALL [DRIVE:][RETURN]

where [DRIVE:] is the designated drive that you want to place the
driver files.

The install program will create a directory named \MOUSE in the
drive you specified and copy the necessary driver files and mouse
menus to that directory for you. 

2. Manual Installation:

If you only want selected files to be copied to your startup disk
and don't want install to modify your AUTOEXEC.BAT file, follow the
manual installation procedure. 

Step 1:    Please write-protect your mouse setup disk.  For a 5¬" disk,
           cover the notch.  For a 3«" disk, flip the (black) switch
           so you can see through it.
Step 1:    Make a backup copy of the mouse setup disk.  For
           information on this procedure, see (diskcopy or xcopy /s)
           in your DOS manual.
Step 2:    If you have a hard disk in your system, you will want to
           make a directory for the mouse driver and pop-up mouse
           menus and then copy the contents of the mouse setup disk
           into that directory. 

Assume your startup drive is C:, put the setup disk
in drive A and at the DOS prompt, type:

           C:
           CD\ [RETURN]       
           MD MOUSE [RETURN]  
           CD MOUSE [RETURN]
Note:  You can substitute another name for MOUSE if you want to 
call the directory something else.

           COPY A:\MOUSE\*.* [RETURN]
           A:\MENU\ZMENU [RETURN]

The mouse drivers, and pop-up menus are now copied to the MOUSE
directory of your startup disk. 

If you do not have a hard disk, you can use your back-up copy of
the setup disk to load the mouse driver and pop-up mouse menus. 
Or, if you prefer, you can copy these programs to the disk you use
to boot up your system.

Step 3:    There are two ways that the mouse driver can be loaded.
The simplest way is to run the program MOUSE.COM.  From the DOS
prompt, type:

           MOUSE [RETURN]

A message similar to that shown here should appear confirming that
the mouse driver is loaded. 

      Z-NIX mouse driver version X.XX
      copyright (c) 1985-1991 All rights reserved
      Install on XXX

The second way to load MOUSE is by including MOUSE.SYS as a device
driver in your CONFIG.SYS file.  This method will have a result that
is identical to running MOUSE.COM each time you boot up your
computer.  Add the line below to your CONFIG.SYS file with a text
editor:
                     DEVICE=C:\MOUSE.SYS

If the MOUSE.SYS file is in a subdirectory, be sure to include the
path.

Step 4:    You should run the mouse test program to make sure the
mouse is properly installed.  To run the program, put your backup
mouse setup disk in drive A and type:
                                                                  
      A:TEST [RETURN]

The test program should put a cursor on the screen which follows
the movement of the mouse.  Also, by pressing the mouse buttons you
should be able to see which of the mouse buttons is on or off.  The
buttons are in the off position until they are clicked or pressed
and held down which would cause them to be in the on position.  When
you are satisfied that everything is working properly, quit the
test to return to DOS.

3. Turning Off The Mouse Driver:

You can disable the MOUSE driver by typing the command:

                MOUSE /OFF [RETURN]

This command releases the serial port the mouse is connected to.  If
no TSRs have been installed after MOUSE.COM, the mouse driver will
be removed from memory.  If MOUSE is installed by using MOUSE.SYS,
you cannot remove it with the above command.

4. Mouse Driver Command-line Options

The mouse drivers MOUSE.COM and MOUSE.SYS are multi-format drivers
that support all of the versions of the Super Mouse.  The mouse
version and mouse port selection is automatic.  When it installs,
the MOUSE driver searches first for a Microsoft compatibe InPort
mouse, then a bus mouse, followed by a PS/2 mouse, and finally a
serial mouse.  If the driver does not find any of these mice, it
will default to installing a driver for a three button Mouse
Systems format mouse on the first serial port it finds.  However,
you can add command-line options to force MOUSE to install a driver
for the type of mouse you have.

Serial Port:

A command-line option can be used to select which COM port the
serial mouse is connected
to.  Type:

      MOUSE /Cn [RETURN] for COM port n

where n is a number from 1 through 4.  For example:

        MOUSE /C2 [RETURN] 

installs the mouse on COM 2.  If you have a PS/2 system with extra
serial ports you can select COM 3 or COM 4 by using the option /C3
or /C4.  If no /C option is used, the driver defaults to selecting
the first serial port that it finds.  If you have the bus or PS/2
versions of the mouse, type:

      MOUSE /B [RETURN]                for bus mouse
      MOUSE /Z [RETURN]                for PS/2 style mouse

For an InPort mouse, you can type:

      MOUSE /I1                        for primary InPort
                                                                  
      MOUSE /I2  for secondary InPort

5. Mouse Driver Scaling Factors:

The position and velocity of the cursor relative to that of the
mouse can be adjusted through the scaling factors of the mouse
driver.  These parameters can be selected and set according to your
personal preference through command-line options.  Experiment with
the options to find a comfortable setting.

There are two kinds of scaling factors built into the mouse driver.
The scaling factor that multiplies or divides the distance
travelled by the mouse by a given number and moves the cursor
according to that result is called sensitivity.  The sensitivity of
the mouse affects the distance the cursor moves on the screen
for a given distance that the mouse travels. Multiplying by a
larger value causes the cursor to move a greater distance relative
to that of the mouse.  Dividing by a number has the opposite effect
and gives you finer control over the mouse. 

When the sensitivity is made non-linear, it is often called
ballistic acceleration effect.  It affects the cursor relative to
the velocity of the mouse.  Rapid mouse motion will cause the cursor
to move a greater distance than slower motion.  This works best
when you have high resolution displays where swift motions of the
mouse allow you to move the cursor large distances to different
areas of the screen while still maintaining fine control over the
cursor when you need it with slow mouse motion. 

Four command-line options are provided to adjust the sensitivity.
The default sensitivity setting provides the same tracking response
as the mouse hardware.  Each sensitivity has a number from 0 to 100.
50 is the default setting.  Values larger than 50 will make the
cursor move a greater distance relative to that of the mouse.  The
command-line options are:

      /S   sets both horizontal and vertical sensitivity
      /H   sets the horizontal sensitivity
      /V   sets the vertical sensitivity

For example /S100 seets for a very speedy mouse.  Or for a very
speedy mouse you would type

      MOUSE /S10 [RETURN]

Four ballistic gain profiles can be set through the following
command line options:

      /M1  select ballistic profile 1 (slow acceleration)          
      /M2  select ballistic profile 2 (moderate)                   
      /M3  select ballistic profile 3 (fast)                       
      /M4  select ballistic profile 4 (no acceleration)

These command line options can be combined together, and they can
also be issued after the mouse driver is initially loaded.  For
example, you can go back to change the sensitivity and ballistic
profile by typing:

      mouse /S75/M3 [RETURN]

If you need a command-line option for MOUSE.SYS, you must include
it in your CONFIG.SYS file. For example:

      DEVICE=C:\MOUSE\MOUSE.SYS /S75/M2

If you need to change your command-line options for MOUSE.SYS, you
must make the changes in your CONFIG.SYS file and re-boot the
machine.

Mouse Driver Movement Profile Loader:

Your mouse driver supports fully Microsoft compatible ballistic
acceleration.  It has four motion profiles, each of which defines
how much cursor motion results from a given amount of mouse motion.
You can experiment with the four default profiles to find one most
comfortable for you.  You can also use the SETSPEED program included
with your mouse setup disk to select which profile is in effect,
load a new set of profile that you have created, or find out which
profile is in effect in your mouse driver.

To use the setspeed utility, you must first load the mouse driver
and then run
                         SETSPEED. 
Type:

      SETSPEED /Mn /Ffilename

where n is a number 1, 2, 3, or 4 selecting motion profiles 1, 2,
3, or 4 respectively, and filename is the (optional) name of a text
file containing motion profiles to be used by the mouse driver.
                                                            
      SETSPEED /?

reports the currently active profile. For example, the command:

      SETSPEED /M3 /Fprofile.txt

selects motion profile 3 from the text file "PROFILE.TXT" in the
current directory.

Motion Profiles:

The motion profile data files are text files arranged like a table
that define the relationship between mouse motion and screen cursor
motion.  Four profiles can be created or modified using any text
editor.  For each movement profile within the text file there is a
list of mouse motions and a list of corresponding scaling factors.
Each pair in the list forms a one to one relationship that defines
the scaling factor the mouse driver would apply to the cursor
movement for a given speed that the mouse is travelling. 

Mouse motion is specified with numbers ranging from 1 to 127.  Each
number represents the increments that the mouse has been moved in
a predefined time interval.  The scaling factors can range from 0 to
16.  You can specify up to 32 entries for the mouse motion, and the
steps between entries do not have to be equal.  For each entry you
must specify a scaling factor.  A scaling factor of 1.0 means that
one mouse motion increment corresponds to one screen motion
increment.  A scaling factor of 0.5 effectively halves the
resolution of the mouse (eg. from 400 cpi to 200 cpi).

We shall use the profile data file "DEFAULT.PRO" included in the
mouse setup disk as an example and guide to the proper syntax of
the motion profile data. The contents of the data files are:

LABEL: Slow
MOVEMENT: 1     5     7     9     11    37    39    41    43
FACTOR:   1.00  1.25  1.50  1.75  2.00  2.25  2.50  2.75  3.00

LABEL: Moderate
MOVEMENT: 1     9     12    15    18    21    24    27    30    33 
  37    41    46
FACTOR:   1.00  1.25  1.50  1.75  2.00  2.25  2.50  2.75  3.00 
3.25  3.50  3.75  4.00

LABEL: Fast
MOVEMENT: 1     2     3     4     5     7     9     11    13    16 
19    22    25    28    31    35    39    43    48   53    60
FACTOR:   1.00  1.25  1.50  1.75  2.00  2.25  2.50  2.75  3.00 
3.25  3.50  3.75  4.00  4.25  4.50  4.75  5.00  5.25  5.50  5.75
6.00

LABEL: Unaccelerated
MOVEMENT: 1
FACTOR:   1.00


If you compare the data files "MODERATE" and "FAST", they show that
when the mouse movement reaches 9, the "MODERATE" profile scales
the cursor motion by a factor of 1.25 while the "FAST" profile
scales it by a factor of 2.5. Proceeding to higher mouse speeds,
there is an overall increase in all of the scaling factors under
the "FAST" profile. The increase in scaling factors is responsible
for faster cursor motion on your screen. If you change the scaling
factors to larger values the cursor moves even faster. To introduce
smooth acceleration to the cursor, you may wish to use equally
spaced movement and scaling factor entries. 

The unaccelerated profile can have only a single entry as shown, or
multiple movement entries with an identical scaling factor. It
introduces results identical to that using the sensitivity
command-line options.

Three button mouse usage                                          
         
The 3 button mouse defaults as a 2 button Microsoft compatible
mouse when you power up your computer. To initialize its hardware
for Mouse System format 3 button mouse; hold down the left button
and then turn on the power to your computer. Once the computer has
booted, you can release the button. Run the mouse driver ( or let
your autoexec.bat or config.sys file load it for you).  The mouse
driver will NOT automatically detect the mouse hardware configuration 
and load the 3 button mouse driver for you.  You will need to add an
argument '/MO' to the mouse command line (ie. MOUSE /MO)

                                                                                                                                                                                             
