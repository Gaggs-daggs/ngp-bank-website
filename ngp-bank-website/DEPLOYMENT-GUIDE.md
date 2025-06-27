# 🚀 NGP Bank Website - Production Deployment Guide

## ✨ Features of Production Server

### 🔄 **Auto Token Refresh**
- Automatically refreshes Zoho access tokens before expiry
- Saves tokens to persistent storage (`token.json`)
- Proactive refresh every 30 minutes
- Graceful handling of token expiration

### 📊 **Analytics & Monitoring**
- Real-time visitor tracking
- Form submission analytics
- Service-wise statistics
- Daily stats tracking
- Health monitoring API

### 🛡️ **Production Ready**
- Error handling and recovery
- Graceful shutdown
- CORS support
- Rate limiting ready
- Environment variable support

## 🌐 Free Hosting Options

### 1. **Heroku (Recommended)**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create ngp-bank-website

# Set environment variables
heroku config:set ZOHO_CLIENT_ID=1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD
heroku config:set ZOHO_CLIENT_SECRET=4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb
heroku config:set ZOHO_REFRESH_TOKEN=1000.82173fa70f31d8ff4accc0f2eaddc173.82edad5eb628dd351546c860fb3da682

# Deploy
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a ngp-bank-website
git push heroku main
```

### 2. **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 3. **Render**
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

### 4. **Vercel (Serverless)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🔧 Environment Variables

Set these in your hosting platform:

```env
ZOHO_CLIENT_ID=1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD
ZOHO_CLIENT_SECRET=4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb
ZOHO_REFRESH_TOKEN=1000.82173fa70f31d8ff4accc0f2eaddc173.82edad5eb628dd351546c860fb3da682
PORT=3000
NODE_ENV=production
```

## 📊 API Endpoints

Once deployed, your website will have:

- **Website**: `https://your-app.herokuapp.com/`
- **Stats API**: `https://your-app.herokuapp.com/api/stats`
- **Health Check**: `https://your-app.herokuapp.com/api/health`
- **Manual Token Refresh**: `https://your-app.herokuapp.com/api/refresh-token`

## 🔄 How Auto-Refresh Works

1. **Startup**: Loads saved token from `token.json`
2. **Monitoring**: Checks token expiry every 30 minutes
3. **Proactive Refresh**: Refreshes 5 minutes before expiry
4. **Persistent Storage**: Saves new tokens automatically
5. **Error Recovery**: Handles refresh failures gracefully

## 📈 Analytics Features

### Real-time Stats
- Total website visits
- Form submissions count
- Success/failure rates
- Service-wise breakdown
- Daily statistics

### Health Monitoring
- Server uptime
- Token validity status
- Token expiration time
- System health status

## 🚀 Quick Start (Local Testing)

```bash
# Start production server
node server-production.js

# Test APIs
curl http://localhost:3000/api/health
curl http://localhost:3000/api/stats
```

## 🛡️ Security Features

- Environment variable protection
- Secure token storage
- CORS configuration
- Error logging without exposing secrets
- Graceful error handling

## 📋 Deployment Checklist

- [ ] Set all environment variables
- [ ] Test token refresh functionality
- [ ] Verify form submissions work
- [ ] Check analytics tracking
- [ ] Test API endpoints
- [ ] Monitor server logs
- [ ] Set up custom domain (optional)

## 🔧 Troubleshooting

### Token Issues
- Check `/api/health` for token status
- Use `/api/refresh-token` to manually refresh
- Verify environment variables are set

### Form Submission Issues
- Check server logs for errors
- Verify Zoho CRM permissions
- Test with `/api/health` endpoint

### Analytics Issues
- Check if `analytics.json` is being created
- Verify write permissions
- Monitor `/api/stats` endpoint

## 🌟 Next Steps

1. **Custom Domain**: Set up your own domain
2. **SSL Certificate**: Enable HTTPS (most platforms do this automatically)
3. **Email Notifications**: Add SMTP configuration
4. **Database**: Add PostgreSQL for advanced analytics
5. **Monitoring**: Set up uptime monitoring
6. **Backup**: Implement data backup strategy

Your NGP Bank website is now production-ready with:
✅ Automatic token management
✅ 24/7 uptime capability
✅ Real-time analytics
✅ Professional hosting
✅ Scalable architecture
