# Simple token test script
$currentToken = "1000.9d2f87375d96e051fc4e5aec57fec5ee.b1a79dc550dbd3fee43394d3e0c13e72"

Write-Host "Testing current access token..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://www.zohoapis.com/crm/v2/org" -Method Get -Headers @{
        'Authorization' = "Zoho-oauthtoken $currentToken"
    }
    Write-Host "Current token is working!" -ForegroundColor Green
    Write-Host "Organization: $($response.org[0].company_name)" -ForegroundColor Cyan
} catch {
    Write-Host "Current token failed. Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get new token
    $clientId = "1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD"
    $clientSecret = "4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb"
    
    $body = @{
        grant_type = "client_credentials"
        client_id = $clientId
        client_secret = $clientSecret
        scope = "ZohoCRM.modules.ALL"
    }
    
    Write-Host "Getting new token..." -ForegroundColor Yellow
    try {
        $tokenResponse = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
        Write-Host "New token received: $($tokenResponse.access_token)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to get new token: $($_.Exception.Message)" -ForegroundColor Red
    }
}
