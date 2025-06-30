const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Production Configuration with Token Management
class TokenManager {
    constructor() {
        this.config = {
            clientId: process.env.ZOHO_CLIENT_ID || '1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD',
            clientSecret: process.env.ZOHO_CLIENT_SECRET || '4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb',
            refreshToken: process.env.ZOHO_REFRESH_TOKEN || '1000.82173fa70f31d8ff4accc0f2eaddc173.82edad5eb628dd351546c860fb3da682'
        };
        
        this.tokenData = {
            accessToken: '1000.e15e5e0fea0194e3d6ae666fd4209ba9.c043e3fa6b385b1479f6bc6d7172af08',
            expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
            refreshToken: this.config.refreshToken
        };
        
        this.loadTokenFromFile();
        this.startAutoRefresh();
    }

    // Load token from persistent storage
    loadTokenFromFile() {
        try {
            if (fs.existsSync('./token.json')) {
                const savedToken = JSON.parse(fs.readFileSync('./token.json', 'utf8'));
                if (savedToken.expiresAt > Date.now() + 300000) { // Valid for at least 5 more minutes
                    this.tokenData = savedToken;
                    console.log('✅ Loaded valid access token from storage');
                    return;
                }
            }
        } catch (error) {
            console.log('⚠️ Could not load token from file, will refresh...');
        }
        
        // If no valid token, refresh immediately
        this.refreshAccessToken();
    }

    // Save token to persistent storage
    saveTokenToFile() {
        try {
            fs.writeFileSync('./token.json', JSON.stringify(this.tokenData, null, 2));
            console.log('💾 Token saved to storage');
        } catch (error) {
            console.error('❌ Failed to save token:', error.message);
        }
    }

    // Check if token needs refresh (refresh 5 minutes before expiry)
    needsRefresh() {
        return Date.now() >= (this.tokenData.expiresAt - 300000);
    }

    // Get current access token
    getAccessToken() {
        if (this.needsRefresh()) {
            console.log('🔄 Token expired, refreshing...');
            this.refreshAccessToken();
        }
        return this.tokenData.accessToken;
    }

    // Refresh access token using refresh token
    async refreshAccessToken() {
        const body = querystring.stringify({
            grant_type: 'refresh_token',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            refresh_token: this.tokenData.refreshToken
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'accounts.zoho.com',
                port: 443,
                path: '/oauth/v2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.access_token) {
                            this.tokenData = {
                                accessToken: response.access_token,
                                expiresAt: Date.now() + (response.expires_in * 1000),
                                refreshToken: response.refresh_token || this.tokenData.refreshToken
                            };
                            
                            this.saveTokenToFile();
                            console.log('✅ Access token refreshed successfully');
                            console.log(`🕐 New token expires at: ${new Date(this.tokenData.expiresAt).toLocaleString()}`);
                            resolve(this.tokenData.accessToken);
                        } else {
                            console.error('❌ Token refresh failed:', data);
                            reject(new Error('Failed to refresh token'));
                        }
                    } catch (error) {
                        console.error('❌ Token refresh error:', error.message);
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Network error during token refresh:', error.message);
                reject(error);
            });

            req.write(body);
            req.end();
        });
    }

    // Start automatic token refresh timer
    startAutoRefresh() {
        // Check every 30 minutes
        setInterval(() => {
            if (this.needsRefresh()) {
                console.log('🔄 Proactive token refresh...');
                this.refreshAccessToken().catch(error => {
                    console.error('❌ Proactive refresh failed:', error.message);
                });
            }
        }, 30 * 60 * 1000); // 30 minutes

        console.log('🔄 Auto-refresh timer started (checks every 30 minutes)');
    }
}

// Analytics with persistent storage
class Analytics {
    constructor() {
        this.stats = {
            totalVisits: 0,
            formSubmissions: 0,
            successfulLeads: 0,
            failedLeads: 0,
            serviceStats: { loan: 0, credit_card: 0, insurance: 0, contact: 0 },
            dailyStats: {},
            startTime: new Date().toISOString()
        };
        this.loadStats();
    }

    loadStats() {
        try {
            if (fs.existsSync('./analytics.json')) {
                const saved = JSON.parse(fs.readFileSync('./analytics.json', 'utf8'));
                this.stats = { ...this.stats, ...saved };
            }
        } catch (error) {
            console.log('📊 Starting fresh analytics...');
        }
    }

    saveStats() {
        try {
            fs.writeFileSync('./analytics.json', JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('❌ Failed to save analytics:', error.message);
        }
    }

    recordVisit() {
        this.stats.totalVisits++;
        const today = new Date().toISOString().split('T')[0];
        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = { visits: 0, leads: 0 };
        }
        this.stats.dailyStats[today].visits++;
        this.saveStats();
    }

    recordFormSubmission(serviceType, success) {
        this.stats.formSubmissions++;
        if (success) {
            this.stats.successfulLeads++;
        } else {
            this.stats.failedLeads++;
        }
        this.stats.serviceStats[serviceType]++;

        const today = new Date().toISOString().split('T')[0];
        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = { visits: 0, leads: 0 };
        }
        this.stats.dailyStats[today].leads++;
        this.saveStats();
    }

    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - new Date(this.stats.startTime).getTime(),
            currentTime: new Date().toISOString()
        };
    }
}

// Enhanced Zoho CRM Integration
class ZohoCRM {
    constructor(tokenManager) {
        this.tokenManager = tokenManager;
    }

    calculateLeadScore(formData, serviceType) {
        let score = 50;
        
        // Service-specific scoring
        if (serviceType === 'loan' && parseInt(formData.loan_amount) > 50000) score += 20;
        if (serviceType === 'credit_card' && parseInt(formData.annual_income) > 75000) score += 15;
        if (serviceType === 'insurance' && parseInt(formData.coverage_amount) > 100000) score += 10;

        // Completeness scoring
        if (formData.phone && formData.phone.length >= 10) score += 10;
        if (formData.message && formData.message.length > 20) score += 5;
        if (formData.email && formData.email.includes('@')) score += 5;

        return Math.min(score, 100);
    }

    async createLead(formData, serviceType) {
        const leadScore = this.calculateLeadScore(formData, serviceType);
        const accessToken = this.tokenManager.getAccessToken();
        
        const leadData = {
            data: [{
                "First_Name": formData.first_name || 'Unknown',
                "Last_Name": formData.last_name || 'User',
                "Email": formData.email,
                "Phone": formData.phone,
                "Lead_Source": "NGP Bank Website",
                "Company": "NGP Bank Lead",
                "Lead_Status": "Not Contacted",
                "Rating": leadScore >= 80 ? "Hot" : leadScore >= 60 ? "Warm" : "Cold",
                "Description": `Service Type: ${serviceType}\nLead Score: ${leadScore}/100\nSubmission Time: ${new Date().toLocaleString()}\n${formData.message || ''}`,
            }]
        };

        // Add service-specific details
        if (serviceType === 'loan') {
            leadData.data[0]["Description"] += `\nLoan Type: ${formData.loan_type}\nLoan Amount: $${formData.loan_amount}`;
        } else if (serviceType === 'credit_card') {
            leadData.data[0]["Description"] += `\nCard Type: ${formData.card_type}\nAnnual Income: $${formData.annual_income}`;
        } else if (serviceType === 'insurance') {
            leadData.data[0]["Description"] += `\nInsurance Type: ${formData.insurance_type}\nCoverage Amount: $${formData.coverage_amount}\nDate of Birth: ${formData.date_of_birth}`;
        }

        return new Promise((resolve) => {
            const postData = JSON.stringify(leadData);
            
            const options = {
                hostname: 'www.zohoapis.com',
                port: 443,
                path: '/crm/v2/Leads',
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', async () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, data: JSON.parse(data), leadScore });
                    } else if (res.statusCode === 401) {
                        // Token might be expired, try refreshing
                        try {
                            await this.tokenManager.refreshAccessToken();
                            const retryResult = await this.createLead(formData, serviceType);
                            resolve(retryResult);
                        } catch (error) {
                            resolve({ success: false, error: 'Token refresh failed', statusCode: res.statusCode });
                        }
                    } else {
                        resolve({ success: false, error: data, statusCode: res.statusCode });
                    }
                });
            });

            req.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });

            req.write(postData);
            req.end();
        });
    }
}

// Initialize components
const tokenManager = new TokenManager();
const analytics = new Analytics();
const zohoCRM = new ZohoCRM(tokenManager);

// Main Server
const server = http.createServer(async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const parsedUrl = url.parse(req.url, true);

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // Analytics for page visits
    if (req.method === 'GET' && !req.url.startsWith('/api/')) {
        analytics.recordVisit();
    }

    // API Routes
    if (req.url.startsWith('/api/')) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });

        if (req.url === '/api/stats') {
            res.end(JSON.stringify(analytics.getStats()));
            return;
        }

        if (req.url === '/api/health') {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                tokenValid: !tokenManager.needsRefresh(),
                tokenExpiresAt: new Date(tokenManager.tokenData.expiresAt).toISOString(),
                uptime: process.uptime()
            };
            res.end(JSON.stringify(health));
            return;
        }

        if (req.url === '/api/refresh-token') {
            try {
                await tokenManager.refreshAccessToken();
                res.end(JSON.stringify({ success: true, message: 'Token refreshed successfully' }));
            } catch (error) {
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
            return;
        }
    }

    // Handle Zoho webhook notifications
    if (req.method === 'POST' && parsedUrl.pathname === '/webhook/zoho') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                console.log('🔔 Zoho webhook received:', body);
                const webhookData = JSON.parse(body);
                
                // Process the webhook data
                // You can add custom business logic here
                console.log('📊 Processing webhook data:', {
                    module: webhookData.module,
                    operation: webhookData.operation,
                    recordId: webhookData.ids
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: true, message: 'Webhook processed successfully' }));
            } catch (error) {
                console.error('❌ Webhook processing error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Form submission
    if (req.method === 'POST' && parsedUrl.pathname === '/submit-form') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        
        req.on('end', async () => {
            try {
                const formData = querystring.parse(body);
                const serviceType = formData.service_type;
                
                console.log(`📝 Form submission from ${clientIP}:`, { 
                    serviceType, 
                    name: `${formData.first_name} ${formData.last_name}`, 
                    email: formData.email,
                    timestamp: new Date().toLocaleString()
                });
                
                const result = await zohoCRM.createLead(formData, serviceType);
                analytics.recordFormSubmission(serviceType, result.success);
                
                res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                
                if (result.success) {
                    console.log(`✅ Lead created successfully in Zoho CRM (Score: ${result.leadScore})`);
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Lead created successfully',
                        leadScore: result.leadScore
                    }));
                } else {
                    console.log('❌ Failed to create lead in Zoho CRM:', result.error);
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: result.error, 
                        statusCode: result.statusCode 
                    }));
                }
            } catch (error) {
                console.error('❌ Server error:', error);
                analytics.recordFormSubmission('unknown', false);
                res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    // Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    if (req.url.startsWith('/oauth/callback')) filePath = './oauth-callback.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Page Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Production server startup
function startServer(port) {
    server.listen(port, () => {
        console.log(`\n🏦 NGP Bank Production Website`);
        console.log(`🌐 Running at: http://localhost:${port}`);
        console.log(`🔄 Auto token refresh: Enabled`);
        console.log(`💾 Persistent storage: Enabled`);
        console.log(`📊 Analytics: Enabled`);
        console.log(`🛡️ Production ready: ✅`);
        console.log(`⚡ Press Ctrl+C to stop the server\n`);
        
        console.log(`📊 API Endpoints:`);
        console.log(`   📈 Stats: http://localhost:${port}/api/stats`);
        console.log(`   💚 Health: http://localhost:${port}/api/health`);
        console.log(`   🔄 Refresh Token: http://localhost:${port}/api/refresh-token\n`);
        
        // Show current token status
        console.log(`🔑 Token Status:`);
        console.log(`   Valid: ${!tokenManager.needsRefresh() ? '✅' : '❌'}`);
        console.log(`   Expires: ${new Date(tokenManager.tokenData.expiresAt).toLocaleString()}\n`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    console.log('💾 Saving analytics...');
    analytics.saveStats();
    console.log('💾 Saving token data...');
    tokenManager.saveTokenToFile();
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Server terminated');
    analytics.saveStats();
    tokenManager.saveTokenToFile();
    process.exit(0);
});

const PORT = process.env.PORT || 3000;
startServer(PORT);
