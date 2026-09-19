48 2A 00 00 80
R01  ;echoes the 2b INS byte
R08  ;return of 48 12 00 00 08 (varies from card to card)
R01  ;fusebyte
R04  ;4 bytes at $83B0
R04  ;card activation timestamp
R03  ;always same 40 b0 03 
R04  ;card# in hex less  the last digit (0001 2345 678x)
R04  ;card# Xored with ird
R02  ;USW <------update status word in hex (number of updates)
R02  ;deals with ppv purchases
R04  ;tier and expiry slot 1 of 80 
R04  ;tier and expiry slot 2 of 80 
R04  ;tier and expiry slot 3 of 80
R04  ;tier and expiry slot 4 of 80
R04  ;tier and expiry slot 5 of 80
R04  ;tier and expiry slot 6 of 80 
R04  ;tier and expiry slot 7 of 80 
R04  ;tier and expiry slot 8 of 80
R04  ;tier and expiry slot 9 of 80
R04  ;tier and expiry slot 10 of 80
R04  ;tier and expiry slot 11 of 80
R04  ;tier and expiry slot 12 of 80
R0C  ;PPV tier slot #1 - DTV 
R0C  ;PPV tier slot #2 - USSB 
R0C  ;PPV tier slot #3 - unused
R0C  ;PPV tier slot #4 - unused
R02  ; sw1 /sw2
