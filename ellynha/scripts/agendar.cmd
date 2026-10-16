@echo off
setlocal
set "ANIV_SCRIPTS=%~dp0"
echo Agendar o presente da Ellynha
echo Data padrao: 02/12/2026 as 15:30, no horario deste computador.
echo Deixe a URL vazia para abrir a copia local do site.
set /p "ANIV_URL=URL do GitHub Pages: "
set /p "ANIV_DATA=Data e hora (yyyy-MM-dd HH:mm), ou Enter para o padrao: "
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p = @{ Destino = $env:ANIV_URL }; if ($env:ANIV_DATA) { $p.Quando = $env:ANIV_DATA }; & (Join-Path $env:ANIV_SCRIPTS 'Agendar.ps1') @p"
if errorlevel 1 echo Nao foi possivel agendar. Confira a mensagem acima.
pause
