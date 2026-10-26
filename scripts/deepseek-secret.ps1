param([ValidateSet('Migrate', 'Read', 'Set')][string]$Action = 'Set')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$projectRoot = Split-Path -Parent $PSScriptRoot
$secretDirectory = Join-Path (Split-Path -Parent $projectRoot) 'private-config\deepseek'
$secretFile = Join-Path $secretDirectory 'api-key.dpapi'
$scope = [Security.Cryptography.DataProtectionScope]::CurrentUser
function Unprotect-Key([string]$path) {
  $bytes = [Convert]::FromBase64String([IO.File]::ReadAllText($path))
  return [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, $scope))
}
if ($Action -eq 'Read') {
  # stdout is captured by the local server only; never invoke Read in an interactive terminal.
  [Console]::Out.Write((Unprotect-Key $secretFile))
  exit
}
$sourceFile = Join-Path $projectRoot 'src\pages\icm\assistant\deepseek.ts'
$sourceText = [IO.File]::ReadAllText($sourceFile)
$envFiles = Get-ChildItem -LiteralPath $projectRoot -File -Force | Where-Object { $_.Name -like '.env*' }
$envPattern = '(?m)^\s*(?:export\s+)?(?:VITE_)?DEEPSEEK_API_KEY\s*=\s*([^\r\n]*)'
$keyPattern = 'FALLBACK_API_KEY\s*=\s*[''"]([^''"]+)[''"]'
if ($Action -eq 'Migrate') {
  $keys = @()
  $match = [regex]::Match($sourceText, $keyPattern)
  if ($match.Success) { $keys += $match.Groups[1].Value.Trim() }
  foreach ($file in $envFiles) {
    foreach ($match in [regex]::Matches([IO.File]::ReadAllText($file.FullName), $envPattern)) {
      $value = $match.Groups[1].Value.Trim().Trim('"').Trim("'")
      if ($value) { $keys += $value }
    }
  }
  $keys = @($keys | Select-Object -Unique)
  if ($keys.Count -eq 0 -and (Test-Path -LiteralPath $secretFile)) { Write-Output 'Encrypted key already present; no plaintext source found.'; exit }
  if ($keys.Count -ne 1) { throw 'Expected one distinct configured key; source files were not changed.' }
  $apiKey = $keys[0]
  if ((Test-Path -LiteralPath $secretFile) -and (Unprotect-Key $secretFile) -cne $apiKey) { throw 'Existing encrypted key differs; source files were not changed.' }
} else {
  $secureInput = Read-Host 'DeepSeek API key' -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureInput)
  try { $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
  if ([string]::IsNullOrWhiteSpace($apiKey)) { throw 'Key must not be empty.' }
}
[IO.Directory]::CreateDirectory($secretDirectory) | Out-Null
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true, $false)
foreach ($sid in @([Security.Principal.WindowsIdentity]::GetCurrent().User, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
  $rule = [Security.AccessControl.FileSystemAccessRule]::new($sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
  $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $secretDirectory -AclObject $acl
$plainBytes = [Text.Encoding]::UTF8.GetBytes($apiKey)
try { $cipher = [Security.Cryptography.ProtectedData]::Protect($plainBytes, $null, $scope) } finally { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
$temporaryFile = Join-Path $secretDirectory 'api-key.pending.dpapi'
[IO.File]::WriteAllText($temporaryFile, [Convert]::ToBase64String($cipher))
if ((Unprotect-Key $temporaryFile) -cne $apiKey) { throw 'Encryption verification failed; source files were not changed.' }
Move-Item -LiteralPath $temporaryFile -Destination $secretFile -Force
[IO.File]::WriteAllText((Join-Path $secretDirectory '.gitignore'), "*`n")
if ($Action -eq 'Migrate') {
  [IO.File]::WriteAllText($sourceFile, $sourceText.Replace($apiKey, ''), [Text.UTF8Encoding]::new($false))
  foreach ($file in $envFiles) {
    $before = [IO.File]::ReadAllText($file.FullName)
    $after = [regex]::Replace($before, $envPattern, '')
    if ($before -cne $after) { [IO.File]::WriteAllText($file.FullName, $after, [Text.UTF8Encoding]::new($false)) }
  }
}
$apiKey = $null
Write-Output 'DeepSeek key encrypted with Windows CurrentUser DPAPI; round-trip verified. No key value logged.'
