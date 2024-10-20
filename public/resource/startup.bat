@echo off
cls

set version=1.0
set wat=Dayz SA

title %wat% Wachdog

cd

:watchdog
echo (%time%) %wat% started.
start "Dayz_SA" /wait /affinity FF /high "DayZServer_x64.exe" -config=serverDZ.cfg "-mod=" -profiles=
echo (%time%) %wat% closed or crashed, restarting.
goto watchdog