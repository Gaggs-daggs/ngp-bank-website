# Simple PowerShell script to get Zoho Self Client access token
Write-Host "Getting Zoho Self Client access token..." -ForegroundColor Yellow

$clientId = "1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD"
$clientSecret = "4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb"

$body = @{
    grant_type = "client_credentials"
    client_id = $clientId
    client_secret = $clientSecret
    scope = "ZohoCRM.modules.ALL"
}

Write-Host "Trying US data center..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    
    if ($response.access_token) {
        Write-Host "SUCCESS! Access token received:" -ForegroundColor Green
        Write-Host "ACCESS TOKEN: $($response.access_token)" -ForegroundColor Cyan
        Write-Host "TOKEN TYPE: $($response.token_type)" -ForegroundColor Yellow
        Write-Host "EXPIRES IN: $($response.expires_in) seconds" -ForegroundColor Yellow
        
        # Update script.js
        Write-Host "Updating website configuration..." -ForegroundColor Yellow
        $scriptPath = ".\script.js"
        if (Test-Path $scriptPath) {
            $scriptContent = Get-Content $scriptPath -Raw
            $updatedContent = $scriptContent -replace "accessToken: '[^']*'", "accessToken: '$($response.access_token)'"
            Set-Content $scriptPath $updatedContent
            Write-Host "Website configuration updated!" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "US failed, trying EU..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "https://accounts.zoho.eu/oauth/v2/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
        
        if ($response.access_token) {
            Write-Host "SUCCESS! Access token received from EU:" -ForegroundColor Green
            Write-Host "ACCESS TOKEN: $($response.access_token)" -ForegroundColor Cyan
            
            # Update script.js
            $scriptPath = ".\script.js"
            if (Test-Path $scriptPath) {
                $scriptContent = Get-Content $scriptPath -Raw
                $updatedContent = $scriptContent -replace "accessToken: '[^']*'", "accessToken: '$($response.access_token)'"
                Set-Content $scriptPath $updatedContent
                Write-Host "Website configuration updated!" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "Failed to get token. Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Manual steps:" -ForegroundColor White
        Write-Host "1. Go to: https://api-console.zoho.com/" -ForegroundColor White
        Write-Host "2. Find your Self Client: NGP Bank" -ForegroundColor White
        Write-Host "3. Click Generate Access Token" -ForegroundColor White
        Write-Host "4. Select scope: ZohoCRM.modules.ALL" -ForegroundColor White
        Write-Host "5. Copy the generated token" -ForegroundColor White
    }
}
