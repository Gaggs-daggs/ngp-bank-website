# Railway Deployment Script for NGP Bank Website
Write-Host "🚀 Deploying NGP Bank Website to Railway..." -ForegroundColor Green

# Check if Railway CLI is installed
Write-Host "📦 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Please install Railway CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g @railway/cli" -ForegroundColor Cyan
    Write-Host "Or download from: https://railway.app/cli" -ForegroundColor Cyan
    exit 1
}

# Initialize Git if not already done
Write-Host "📂 Setting up Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Add all files
Write-Host "📁 Adding files to Git..." -ForegroundColor Yellow
git add .
git commit -m "Deploy NGP Bank Website to Railway" -ErrorAction SilentlyContinue

Write-Host "🔑 Please follow these steps:" -ForegroundColor White
Write-Host "1. Run: railway login" -ForegroundColor Cyan
Write-Host "2. Run: railway init" -ForegroundColor Cyan
Write-Host "3. Select 'Create new project'" -ForegroundColor Cyan
Write-Host "4. Name it: ngp-bank-website" -ForegroundColor Cyan
Write-Host "5. Run: railway up" -ForegroundColor Cyan

Write-Host "`n📋 Environment Variables to Set:" -ForegroundColor White
Write-Host "After deployment, set these in Railway dashboard:" -ForegroundColor Yellow
Write-Host "ZOHO_CLIENT_ID=1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD" -ForegroundColor Cyan
Write-Host "ZOHO_CLIENT_SECRET=4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb" -ForegroundColor Cyan
Write-Host "ZOHO_REFRESH_TOKEN=1000.82173fa70f31d8ff4accc0f2eaddc173.82edad5eb628dd351546c860fb3da682" -ForegroundColor Cyan
Write-Host "NODE_ENV=production" -ForegroundColor Cyan

Write-Host "`n🌐 After deployment, your website will be available at:" -ForegroundColor White
Write-Host "https://ngp-bank-website-production.up.railway.app" -ForegroundColor Green

Write-Host "`n📊 API Endpoints will be:" -ForegroundColor White
Write-Host "📈 Stats: https://your-domain.railway.app/api/stats" -ForegroundColor Cyan
Write-Host "💚 Health: https://your-domain.railway.app/api/health" -ForegroundColor Cyan
Write-Host "🔄 Refresh: https://your-domain.railway.app/api/refresh-token" -ForegroundColor Cyan

Write-Host "`n✅ Ready for Railway deployment!" -ForegroundColor Green
