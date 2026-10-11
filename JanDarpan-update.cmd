@echo off
rem Update Jan Darpan with the latest information and publish it.
rem   JanDarpan-update.cmd           full update
rem   JanDarpan-update.cmd --quick   headlines and accounts only
rem   JanDarpan-update.cmd --no-push collect only, do not publish
cd /d "%~dp0"
python scripts\update.py %*
echo.
pause
