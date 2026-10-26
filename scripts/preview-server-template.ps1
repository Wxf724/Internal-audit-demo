param([ValidateRange(1024,65535)][int]$Port = 4180, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'site'))
if (-not (Test-Path -LiteralPath (Join-Path $siteRoot 'index.html'))) { throw 'Missing site/index.html. Extract the complete ZIP before starting.' }
$listener = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Port)
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.mjs'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.webp'='image/webp'; '.ico'='image/x-icon'; '.woff2'='font/woff2'; '.woff'='font/woff'; '.ttf'='font/ttf'; '.wasm'='application/wasm'; '.pdf'='application/pdf'; '.txt'='text/plain; charset=utf-8' }
try {
  $listener.Start()
  $url = "http://127.0.0.1:$Port/"
  Write-Host "Internal Audit Demo: $url"
  Write-Host 'Keep this window open. Close the window or press Ctrl+C to stop.'
  if (-not $NoBrowser) { Start-Process $url }
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $null
    try {
      $client.ReceiveTimeout = 5000; $client.SendTimeout = 15000
      $stream = $client.GetStream()
      $header = New-Object 'Collections.Generic.List[byte]'
      while ($header.Count -lt 16384) {
        $byte = $stream.ReadByte()
        if ($byte -lt 0) { break }
        $header.Add([byte]$byte)
        $n = $header.Count
        if ($n -ge 4 -and $header[$n-4] -eq 13 -and $header[$n-3] -eq 10 -and $header[$n-2] -eq 13 -and $header[$n-1] -eq 10) { break }
      }
      $request = [Text.Encoding]::ASCII.GetString($header.ToArray())
      $line = ($request -split "`r`n")[0] -split ' '
      $status = '200 OK'; $type = 'text/plain; charset=utf-8'; $file = $null; $body = ''
      if ($line.Length -lt 3 -or $line[0] -notin @('GET','HEAD')) { $status = '405 Method Not Allowed'; $body = 'Only GET and HEAD are supported.' }
      elseif ($request -notmatch "(?im)^Host: (127\.0\.0\.1|localhost):$Port\s*$") { $status = '403 Forbidden'; $body = 'Local preview only.' }
      else {
        $raw = [Uri]::UnescapeDataString(($line[1] -split '\?',2)[0])
        if ($raw.Contains([char]0) -or $raw.Contains(':')) { $status = '400 Bad Request'; $body = 'Invalid path.' }
        else {
          $relative = $raw.TrimStart('/').Replace('/',[IO.Path]::DirectorySeparatorChar)
          $candidate = [IO.Path]::GetFullPath((Join-Path $siteRoot $relative))
          $inside = $candidate.StartsWith($siteRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or $candidate -eq $siteRoot
          if (-not $inside) { $status = '403 Forbidden'; $body = 'Path denied.' }
          elseif ($raw -eq '/__preview_health') { $type = 'application/json'; $body = '{"app":"InternalAudit","status":"ok"}' }
          elseif ($raw -eq '/api' -or $raw.StartsWith('/api/')) { $status = '503 Service Unavailable'; $type = 'application/json'; $body = '{"error":"Backend services are not included in this local demo."}' }
          elseif (Test-Path -LiteralPath $candidate -PathType Leaf) { $file = $candidate }
          elseif ($raw -eq '/' -or ($request -match '(?im)^Accept:.*text/html' -and [IO.Path]::GetExtension($candidate) -eq '')) { $file = Join-Path $siteRoot 'index.html' }
          else { $status = '404 Not Found'; $body = 'Not found.' }
        }
      }
      if ($file) {
        $extension = [IO.Path]::GetExtension($file).ToLowerInvariant()
        if ($mime.ContainsKey($extension)) { $type = $mime[$extension] } else { $type = 'application/octet-stream' }
        $bytes = [IO.File]::ReadAllBytes($file)
      } else { $bytes = [Text.Encoding]::UTF8.GetBytes($body) }
      $response = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`nX-Content-Type-Options: nosniff`r`n`r`n")
      $stream.Write($response,0,$response.Length)
      if ($line[0] -ne 'HEAD') { $stream.Write($bytes,0,$bytes.Length) }
      $stream.Flush()
    } catch { Write-Verbose $_.Exception.Message }
    finally { if ($stream) { $stream.Dispose() }; $client.Close() }
  }
} catch { Write-Host ('Cannot start preview: ' + $_.Exception.Message); exit 1 }
finally { $listener.Stop() }
