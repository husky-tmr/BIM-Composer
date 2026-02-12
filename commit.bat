@echo off
REM Quick commit helper for conventional commits
REM Usage: commit.bat <type> <scope> <message>
REM Example: commit.bat feat viewer "add zoom controls"

if "%~1"=="" (
    echo Usage: commit.bat ^<type^> ^<scope^> ^<message^>
    echo.
    echo Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
    echo.
    echo Example: commit.bat feat viewer "add zoom controls"
    exit /b 1
)

if "%~2"=="" (
    echo Error: scope is required
    echo Example: commit.bat feat viewer "add zoom controls"
    exit /b 1
)

if "%~3"=="" (
    echo Error: message is required
    echo Example: commit.bat feat viewer "add zoom controls"
    exit /b 1
)

git commit -m "%~1(%~2): %~3"
