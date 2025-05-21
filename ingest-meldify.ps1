$workspace = "Meldify"
$rootPath = "K:\Development-2025\Meldify"
$HASH_CACHE_FILE = "$rootPath\.ingest-hash-cache.json"
$uploadEndpoint = "http://localhost:3001/api/workspaces/$workspace/documents/upload"

function Get-FileHashMap {
    $hashes = @{}
    Get-ChildItem -Path $rootPath -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    ForEach-Object {
        $hash = Get-FileHash -Path $_.FullName -Algorithm SHA256
        $relative = $_.FullName.Substring($rootPath.Length + 1)
        $hashes[$relative] = $hash.Hash
    }
    return $hashes
}

function Load-PreviousHashCache {
    if (Test-Path $HASH_CACHE_FILE) {
        $raw = Get-Content $HASH_CACHE_FILE -Raw | ConvertFrom-Json
        if ($raw -is [hashtable]) {
            return $raw
        }
        return @{}
    }
    return @{}
}


function Save-HashCache($hashes) {
    $hashes | ConvertTo-Json -Depth 3 | Set-Content $HASH_CACHE_FILE
}

function Upload-FileWithRetry($filePath, $relativePath, $maxRetries = 3) {
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
        try {
            $response = Invoke-RestMethod -Uri $uploadEndpoint `
                -Method Post -InFile $filePath `
                -Headers @{
                    "Content-Type" = "application/octet-stream"
                    "x-file-name" = $relativePath
                }

            Write-Host "[OK] Uploaded: $relativePath"
            Write-Host "[→] Server response: $($response | ConvertTo-Json -Depth 3)"
            $success = $true
        } catch {
            Write-Warning "[!] Failed to upload: $relativePath (Attempt $($retryCount + 1))"
            Start-Sleep -Seconds 2
            $retryCount++
        }
    }

    if (-not $success) {
        Write-Error "[X] Giving up on: $relativePath after $maxRetries attempts"
    }
}

function Upload-ChangedFiles($newHashes, $oldHashes) {
    foreach ($file in $newHashes.Keys) {
        if (-not $oldHashes.ContainsKey($file) -or $newHashes[$file] -ne $oldHashes[$file]) {
            $fullPath = Join-Path $rootPath $file
            Upload-FileWithRetry -filePath $fullPath -relativePath $file
        }
    }
}

Write-Host "Starting Meldify ingestion for workspace: '$workspace'..."
Write-Host "Scanning directory: $rootPath"

$newHashes = Get-FileHashMap
Write-Host "Found $($newHashes.Count) files in current directory scan."

$oldHashes = Load-PreviousHashCache
Write-Host "Loaded $($oldHashes.Count) file hashes from previous cache.`n"

Upload-ChangedFiles $newHashes $oldHashes

Save-HashCache $newHashes
Write-Host "`n[OK] Ingestion for '$workspace' complete.`n"
