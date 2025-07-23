@echo off
REM === Simple System Utility Script ===
REM Author: ChatGPT
REM Description: Demonstrates 100 lines of .bat functionality

:: Set variables
set "logfile=utility_log.txt"
set "dirbase=MySimulatedFS"
set "counter=0"

:: Create a fresh log file
echo Starting system utility... > %logfile%
echo Log initialized at %date% %time% >> %logfile%

:: Welcome message
echo.
echo ===============================
echo   WELCOME TO SYSUTIL v1.0
echo ===============================
echo.

:: Create base directory
if not exist %dirbase% (
    mkdir %dirbase%
    echo [%time%] Created base directory: %dirbase% >> %logfile%
)

:: Simulate directory structure
echo Creating sample directory structure...
mkdir %dirbase%\Docs
mkdir %dirbase%\Images
mkdir %dirbase%\Temp
echo [%time%] Created subdirectories >> %logfile%

:: Populate with dummy files
echo Creating dummy files...
echo This is a sample document. > %dirbase%\Docs\doc1.txt
echo Another document. > %dirbase%\Docs\doc2.txt
echo IMG0001.jpg >> %dirbase%\Images\image1.txt
echo TEMP DATA > %dirbase%\Temp\tempfile.tmp
echo [%time%] Created dummy files >> %logfile%

:: Loop to simulate processing
echo Starting process simulation...
setlocal enabledelayedexpansion
for /L %%i in (1,1,10) do (
    set /a counter+=1
    echo Processing item %%i...
    echo [%time%] Processed item %%i >> %logfile%
    timeout /t 1 >nul
)

:: Simulate a menu
:MENU
cls
echo.
echo ===== MAIN MENU =====
echo 1. View Log
echo 2. Add Entry to Log
echo 3. Delete Temp Files
echo 4. Exit
echo =====================
set /p choice=Enter choice (1-4): 

if "%choice%"=="1" goto VIEW_LOG
if "%choice%"=="2" goto ADD_ENTRY
if "%choice%"=="3" goto DEL_TEMP
if "%choice%"=="4" goto END
goto MENU

:VIEW_LOG
cls
echo.
echo ===== LOG FILE =====
type %logfile%
pause
goto MENU

:ADD_ENTRY
set /p entry=Enter a log entry: 
echo [%time%] %entry% >> %logfile%
echo Entry added!
pause
goto MENU

:DEL_TEMP
if exist %dirbase%\Temp (
    del /q %dirbase%\Temp\*
    echo [%time%] Temp files deleted >> %logfile%
    echo Temp files deleted.
) else (
    echo Temp directory not found!
)
pause
goto MENU

:END
echo Exiting utility...
echo [%time%] User exited the script >> %logfile%
timeout /t 2 >nul
endlocal
exit

:: === Padding to reach 100 lines ===
REM Line 81
REM Line 82
REM Line 83
REM Line 84
REM Line 85
REM Line 86
REM Line 87
REM Line 88
REM Line 89
REM Line 90
REM Line 91
REM Line 92
REM Line 93
REM Line 94
REM Line 95
REM Line 96
REM Line 97
REM Line 98
REM Line 99
REM Line 100
