# SecureOS Digital Integrity Monitor — Windows Telemetry Agent
# Collector only: gathers observations and POSTs them to SecureOS.
# It never changes the Trust Score and never executes remediation.

param(
  [string]$IngestUrl = "http://localhost:3000/api/telemetry/ingest",
  [int]$IntervalSeconds = 15,
  [int]$ProcessSampleLimit = 150,
  [string]$AgentToken = $env:SECUREOS_AGENT_TOKEN
)

[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocolType::Tls12
$ErrorActionPreference = 'SilentlyContinue'
$HostId = $env:COMPUTERNAME
$Timer = New-Object System.Timers.Timer
$Timer.Interval = [Math]::Max(5000, $IntervalSeconds * 1000)
$Timer.AutoReset = $true

$script:LastServiceState = @{}
$script:LastHostsHash = ''

function Send-SecureOSPayload {
  param([string]$Category, [hashtable]$Payload)
  $body = @{ collector='powershell_agent'; host_id=$HostId; timestamp=(Get-Date).ToUniversalTime().ToString('o'); category=$Category; payload=$Payload } | ConvertTo-Json -Depth 8 -Compress
  $headers = @{}
  if ($AgentToken) { $headers['X-SecureOS-Agent-Token'] = $AgentToken }
  try {
    $result = Invoke-RestMethod -Uri $IngestUrl -Method Post -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 8
    if ($null -ne $result.trust_score) { Write-Host "[SecureOS] $Category -> Trust $($result.trust_score.current_score)%" -ForegroundColor Cyan }
  } catch { Write-Warning "[SecureOS] telemetry delivery failed: $($_.Exception.Message)" }
}

function Collect-Telemetry {
  Get-Process | Select-Object -First $ProcessSampleLimit | ForEach-Object {
    $path=''; $signed=$false
    try { $path=$_.Path } catch {}
    if ($path -and (Test-Path $path)) { try { $signed=((Get-AuthenticodeSignature -FilePath $path).Status -eq 'Valid') } catch {} }
    if (-not $signed -or ($path -and ($path -match '\\AppData\\|\\Temp\\'))) {
      Send-SecureOSPayload -Category 'process' -Payload @{ Id=$_.Id; Name=$_.ProcessName; Path=$path; IsSigned=$signed; Handles=$_.Handles; WorkingSet=$_.WorkingSet64 }
    }
  }

  @('WinDefend','EventLog','CryptSvc','MpsSvc') | ForEach-Object {
    $service=Get-Service -Name $_
    if ($service) {
      $startMode='Unknown'
      try { $startMode=(Get-CimInstance Win32_Service -Filter "Name='$($service.Name)'").StartMode } catch {}
      $state="$($service.Status)|$startMode"
      if ($script:LastServiceState[$service.Name] -ne $state) {
        $script:LastServiceState[$service.Name]=$state
        Send-SecureOSPayload -Category 'service' -Payload @{ Name=$service.Name; Status=$service.Status.ToString(); StartType=$startMode }
      }
    }
  }

  Get-NetTCPConnection -State Established | Where-Object {
    $_.RemotePort -in 4444,1337,8888,6667,9001
  } | ForEach-Object {
    Send-SecureOSPayload -Category 'net_conn' -Payload @{ OwningProcess=$_.OwningProcess; LocalAddress=$_.LocalAddress; LocalPort=$_.LocalPort; RemoteAddress=$_.RemoteAddress; RemotePort=$_.RemotePort; State=$_.State.ToString() }
  }

  $hostsPath=Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
  if (Test-Path $hostsPath) {
    $hash=(Get-FileHash -Path $hostsPath -Algorithm SHA256).Hash
    $isModified = $false
    if ($script:LastHostsHash -and $script:LastHostsHash -ne $hash) { $isModified = $true }
    if ($script:LastHostsHash -ne $hash) {
      $previousHash=$script:LastHostsHash
      $script:LastHostsHash=$hash
      Send-SecureOSPayload -Category 'fim' -Payload @{ Path=$hostsPath; HashSHA256=$hash; PreviousHash=$previousHash; IsModified=$isModified; ObservedAt=(Get-Date).ToUniversalTime().ToString('o') }
    }
  }
}

Write-Host "[SecureOS] Agent started | Host: $HostId | Interval: $IntervalSeconds s" -ForegroundColor Cyan
Write-Host "[SecureOS] Collector only — deterministic Trust Engine remains authoritative." -ForegroundColor Gray
if ($AgentToken) { Write-Host "[SecureOS] Agent authentication: enabled" -ForegroundColor Gray } else { Write-Warning "[SecureOS] Agent authentication token not configured; localhost-only mode recommended." }
$Timer.add_Elapsed({ Collect-Telemetry })
Collect-Telemetry
$Timer.Start()
try { while($Timer.Enabled){ Start-Sleep -Seconds 1 } } finally { $Timer.Stop(); $Timer.Dispose() }
