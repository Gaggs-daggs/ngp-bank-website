# Test current token and get a new one if needed
$currentToken = "1000.9d2f87375d96e051fc4e5aec57fec5ee.b1a79dc550dbd3fee43394d3e0c13e72"

Write-Host "Testing current access token..." -ForegroundColor Yellow

# Test current token
try {
    $response = Invoke-RestMethod -Uri "https://www.zohoapis.com/crm/v2/org" -Method Get -Headers @{
        'Authorization' = "Zoho-oauthtoken $currentToken"
    }
    Write-Host "✅ Current token is working!" -ForegroundColor Green
    Write-Host "Organization: $($response.org[0].company_name)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Current token failed. Getting a new one..." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Get new token using client credentials
    $clientId = "1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD"
    $clientSecret = "4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb"
    
    $body = @{
        grant_type = "client_credentials"
        client_id = $clientId
        client_secret = $clientSecret
        scope = "ZohoCRM.modules.ALL"
    }
    
    try {
        Write-Host "🔄 Getting new token..." -ForegroundColor Yellow
        $tokenResponse = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
        
        if ($tokenResponse.access_token) {
            Write-Host "✅ New token received!" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            Write-Host "NEW ACCESS TOKEN: $($tokenResponse.access_token)" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            
            # Test the new token
            Write-Host "🔍 Testing new token..." -ForegroundColor Yellow
            try {
                $testResponse = Invoke-RestMethod -Uri "https://www.zohoapis.com/crm/v2/org" -Method Get -Headers @{
                    'Authorization' = "Zoho-oauthtoken $($tokenResponse.access_token)"
                }
                Write-Host "✅ New token works! Organization: $($testResponse.org[0].company_name)" -ForegroundColor Green
                
                Write-Host "`n📝 Copy this token and paste it here:" -ForegroundColor White
                Write-Host "$($tokenResponse.access_token)" -ForegroundColor Yellow
                
            } catch {
                Write-Host "❌ New token test failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "❌ Failed to get new token: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n🔧 Manual method:" -ForegroundColor White
        Write-Host "1. Go to: https://api-console.zoho.com/" -ForegroundColor White
        Write-Host "2. Find your Self Client app" -ForegroundColor White
        Write-Host "3. Click 'Generate Access Token'" -ForegroundColor White
        Write-Host "4. Select scope: ZohoCRM.modules.ALL" -ForegroundColor White
        Write-Host "5. Copy the token and paste it here" -ForegroundColor White
    }
}
