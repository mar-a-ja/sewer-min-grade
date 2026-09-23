@echo off
cd /d "%~dp0"
echo Starting Icon Water sewer grade at http://127.0.0.1:8766/
python serve.py
if errorlevel 1 (
  echo.
  echo Could not start. Is Python on PATH?
  pause
)
