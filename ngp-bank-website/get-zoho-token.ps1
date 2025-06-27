# PowerShell script to get Zoho access token
param(
    [Parameter(Mandatory=$true)]
    [string]$AuthorizationCode
)

Write-Host "🔄 Getting Zoho access token..." -ForegroundColor Yellow

$clientId = "1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD"
$clientSecret = "4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb"
$redirectUri = "http://localhost:3000/oauth/callback"

$body = @{
    grant_type = "authorization_code"
    client_id = $clientId
    client_secret = $clientSecret
    redirect_uri = $redirectUri
    code = $AuthorizationCode
}

try {
    $response = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    
    if ($response.access_token) {
        Write-Host "✅ SUCCESS! Access token received:" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "ACCESS TOKEN: $($response.access_token)" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "REFRESH TOKEN: $($response.refresh_token)" -ForegroundColor Yellow
        Write-Host "EXPIRES IN: $($response.expires_in) seconds" -ForegroundColor Yellow
        
        # Update script.js automatically
        Write-Host "🔧 Updating website configuration..." -ForegroundColor Yellow
        
        $scriptPath = ".\script.js"
        if (Test-Path $scriptPath) {
            $scriptContent = Get-Content $scriptPath -Raw
            $updatedContent = $scriptContent -replace "accessToken: '[^']*'", "accessToken: '$($response.access_token)'"
            Set-Content $scriptPath $updatedContent
            
            Write-Host "✅ Website configuration updated successfully!" -ForegroundColor Green
            Write-Host "🚀 Your NGP Bank website is now ready!" -ForegroundColor Green
            Write-Host "📍 Visit: http://localhost:3000" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️ Could not find script.js file" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Error: No access token received" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n📋 Next steps:" -ForegroundColor White
Write-Host "1. Copy the ACCESS TOKEN above" -ForegroundColor White
Write-Host "2. Go to http://localhost:3000" -ForegroundColor White
Write-Host "3. Test your forms!" -ForegroundColor White
