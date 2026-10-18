# Sneakers native-analysis diagnostic — run 39160181684

## findcrypt-sentinel.log

```text
openjdk version "21.0.12.1" 2026-08-18 LTS
OpenJDK Runtime Environment Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.12.1+1 (build 21.0.12.1+1-LTS, mixed mode)
INFO  Using log config file: jar:file:/home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Framework/Generic/lib/Generic.jar!/generic.log4j.xml (LoggingInitialization)  
INFO  Using log file: /home/runner/.config/ghidra/ghidra_12.1.4_PUBLIC/application.log (LoggingInitialization)  
INFO  Loading user preferences: /home/runner/.config/ghidra/ghidra_12.1.4_PUBLIC/preferences (Preferences)  
INFO  Searching for classes... (ClassSearcher)  
INFO  Class search complete (954 ms) (ClassSearcher)  
INFO  Initializing SSL Context (DefaultSSLContextInitializer)  
INFO  Initializing Random Number Generator... (SecureRandomFactory)  
INFO  Random Number Generator initialization complete: NativePRNGNonBlocking (SecureRandomFactory)  
INFO  Trust manager disabled, cacerts have not been set (DefaultTrustManagerFactory)  
INFO  Starting cache cleanup: /var/tmp/runner-ghidra/fscache2 (FileCacheMaintenanceDaemon)  
INFO  Finished cache cleanup, estimated storage used: 0 (FileCacheMaintenanceDaemon)  
INFO  Headless startup complete (4244 ms) (AnalyzeHeadless)  
INFO  Class searcher loaded 93 extension points (46 false positives) (ClassSearcher)  
INFO  HEADLESS Script Paths:
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/PyGhidra/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Processors/JVM/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/MicrosoftCodeAnalyzer/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/SystemEmulation/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Processors/PIC/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Debug/Debugger/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Processors/Atmel/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/Decompiler/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/WildcardAssembler/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Processors/DATA/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Debug/Debugger-rmi-trace/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/VersionTracking/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/Base/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/FunctionID/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Processors/8051/ghidra_scripts
    /home/runner/work/Html5/Html5/tools/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/BytePatterns/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/FileFormats/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/BSim/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/PDB/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/GnuDemangler/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/DecompilerDependent/ghidra_scripts
    /home/runner/work/_temp/ghidra_12.1.4_PUBLIC/Ghidra/Features/SwiftDemangler/ghidra_scripts (HeadlessAnalyzer)  
INFO  HEADLESS: execution starts (HeadlessAnalyzer)  
INFO  Creating temporary project: /home/runner/work/_temp/sneakers-original/projects/Sneakers_FindCrypt_Sentinel (HeadlessAnalyzer)  
ERROR Abort due to Headless analyzer error: Directory not found: /home/runner/work/_temp/sneakers-original/projects (HeadlessAnalyzer) java.io.FileNotFoundException: Directory not found: /home/runner/work/_temp/sneakers-original/projects
	at ghidra.framework.project.DefaultProjectManager.createProject(DefaultProjectManager.java:100)
	at ghidra.app.util.headless.HeadlessAnalyzer.processLocal(HeadlessAnalyzer.java:439)
	at ghidra.app.util.headless.AnalyzeHeadless.launch(AnalyzeHeadless.java:199)
	at ghidra.GhidraLauncher.launch(GhidraLauncher.java:81)
	at ghidra.Ghidra.main(Ghidra.java:54)
 
```

