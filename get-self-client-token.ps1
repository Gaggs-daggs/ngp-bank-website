# PowerShell script to get Zoho Self Client access token
Write-Host "🔄 Getting Zoho Self Client access token..." -ForegroundColor Yellow

# Your Self Client credentials
$clientId = "1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD"
$clientSecret = "4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb"

# Self Client uses client_credentials grant type
$body = @{
    grant_type = "client_credentials"
    client_id = $clientId
    client_secret = $clientSecret
    scope = "ZohoCRM.modules.ALL"
}

Write-Host "🌍 Trying different Zoho data centers..." -ForegroundColor Yellow

# Try different Zoho data centers
$urls = @(
    "https://accounts.zoho.com/oauth/v2/token",
    "https://accounts.zoho.eu/oauth/v2/token", 
    "https://accounts.zoho.in/oauth/v2/token",
    "https://accounts.zoho.com.au/oauth/v2/token"
)

foreach ($url in $urls) {
    try {
        Write-Host "Trying: $url" -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
        
        if ($response.access_token) {
            Write-Host "✅ SUCCESS! Access token received from: $url" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            Write-Host "ACCESS TOKEN: $($response.access_token)" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            Write-Host "TOKEN TYPE: $($response.token_type)" -ForegroundColor Yellow
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
            
            # Test the token
            Write-Host "`n🔍 Testing the access token..." -ForegroundColor Yellow
            try {
                $testResponse = Invoke-RestMethod -Uri "https://www.zohoapis.com/crm/v2/org" -Method Get -Headers @{
                    'Authorization' = "Zoho-oauthtoken $($response.access_token)"
                }
                Write-Host "✅ Token is working! Organization: $($testResponse.org[0].company_name)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Token test failed, but token was generated. Check your Zoho CRM setup." -ForegroundColor Yellow
            }
            
            return
        }
    } catch {
        Write-Host "❌ Failed with $url : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n❌ All data centers failed. Possible issues:" -ForegroundColor Red
Write-Host "1. Self Client may need activation in Zoho Developer Console" -ForegroundColor Yellow
Write-Host "2. Scope 'ZohoCRM.modules.ALL' may not be configured" -ForegroundColor Yellow
Write-Host "3. Account may be in a different data center" -ForegroundColor Yellow

Write-Host "`n📋 Manual steps to get token:" -ForegroundColor White
Write-Host "1. Go to: https://api-console.zoho.com/" -ForegroundColor White
Write-Host "2. Find your Self Client: NGP Bank" -ForegroundColor White
Write-Host "3. Click Generate Access Token" -ForegroundColor White
Write-Host "4. Select scope: ZohoCRM.modules.ALL" -ForegroundColor White
Write-Host "5. Copy the generated token" -ForegroundColor White
