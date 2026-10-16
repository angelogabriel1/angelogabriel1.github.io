param(
    [string]$Destino = '',
    [string]$Quando = '2026-12-02 15:30',
    [string]$NomeTarefa = 'Aniversario-Ellynha',
    [switch]$Simular
)
$ErrorActionPreference = 'Stop'
# Compativel com Windows PowerShell 5.1 (Windows 10 e 11).
$data = [DateTime]::ParseExact($Quando, 'yyyy-MM-dd HH:mm', [Globalization.CultureInfo]::InvariantCulture)
if ($data -le (Get-Date)) { throw 'Escolha uma data futura, no formato yyyy-MM-dd HH:mm.' }
if ([string]::IsNullOrWhiteSpace($Destino)) {
    $Destino = Join-Path (Split-Path $PSScriptRoot -Parent) 'index.html'
}
$uri = $null
$web = [Uri]::TryCreate($Destino, [UriKind]::Absolute, [ref]$uri) -and ($uri.Scheme -eq 'https' -or $uri.Scheme -eq 'http')
if (-not $web) {
    if (-not (Test-Path -LiteralPath $Destino -PathType Leaf)) { throw 'Arquivo local nao encontrado. Informe um index.html ou uma URL http/https.' }
    $Destino = (Resolve-Path -LiteralPath $Destino).Path
}
# Codificacao impede que aspas ou caracteres especiais virem comandos.
$literal = $Destino.Replace("'", "''")
$comando = "Start-Process -FilePath '$literal'"
$codificado = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($comando))
$executavel = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$argumentos = '-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ' + $codificado
if ($Simular) {
    Write-Output ('Destino: ' + $Destino)
    Write-Output ('Data local do computador: ' + $data.ToString('yyyy-MM-dd HH:mm'))
    Write-Output ('Tarefa: ' + $NomeTarefa)
    Write-Output 'Simulacao concluida. Nenhuma tarefa foi criada e nenhum navegador foi aberto.'
    return
}
if (Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue) {
    throw 'Ja existe uma tarefa com esse nome. Remova-a ou use outro -NomeTarefa.'
}
$acao = New-ScheduledTaskAction -Execute $executavel -Argument $argumentos
$gatilho = New-ScheduledTaskTrigger -Once -At $data
$usuario = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
# Nao abre a surpresa atrasada caso o computador esteja desligado na hora.
$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName $NomeTarefa -Action $acao -Trigger $gatilho -Principal $principal -Settings $ajustes -Description 'Abre o presente da Ellynha no navegador padrao.' | Out-Null
Write-Output ('Agendado para ' + $data.ToString('dd/MM/yyyy HH:mm') + ' (horario local do computador).')
Write-Output 'Confira no Agendador de Tarefas. O usuario deve estar conectado e a tela desbloqueada para ver a pagina.'
