@echo off
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8766 ^| findstr LISTENING') do taskkill /PID %%p /F
echo Stopped anything listening on port 8766.
