const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Enhanced Configuration
const CONFIG = {
    zoho: {
        accessToken: process.env.ZOHO_ACCESS_TOKEN || '1000.e15e5e0fea0194e3d6ae666fd4209ba9.c043e3fa6b385b1479f6bc6d7172af08',
        clientId: process.env.ZOHO_CLIENT_ID || '1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD',
        clientSecret: process.env.ZOHO_CLIENT_SECRET || '4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb',
        refreshToken: process.env.ZOHO_REFRESH_TOKEN || '1000.82173fa70f31d8ff4accc0f2eaddc173.82edad5eb628dd351546c860fb3da682',
        apiUrl: 'https://www.zohoapis.com/crm/v2'
    },
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },
    features: {
        analytics: true,
        rateLimit: true,
        emailNotifications: true,
        leadScoring: true,
        autoResponder: true
    }
};

// Enhanced Analytics and Logging
class Analytics {
    constructor() {
        this.stats = {
            totalVisits: 0,
            formSubmissions: 0,
            successfulLeads: 0,
            failedLeads: 0,
            serviceStats: {
                loan: 0,
                credit_card: 0,
                insurance: 0,
                contact: 0
            },
            dailyStats: {}
        };
        this.loadStats();
    }

    loadStats() {
        try {
            if (fs.existsSync('./analytics.json')) {
                this.stats = JSON.parse(fs.readFileSync('./analytics.json', 'utf8'));
            }
        } catch (error) {
            console.log('📊 Starting fresh analytics...');
        }
    }

    saveStats() {
        fs.writeFileSync('./analytics.json', JSON.stringify(this.stats, null, 2));
    }

    recordVisit(req) {
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
        return this.stats;
    }
}

// Rate Limiting
class RateLimit {
    constructor() {
        this.requests = new Map();
        this.windowMs = 15 * 60 * 1000; // 15 minutes
        this.maxRequests = 100; // max requests per window
    }

    isAllowed(ip) {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        if (!this.requests.has(ip)) {
            this.requests.set(ip, []);
        }

        const requests = this.requests.get(ip);
        // Remove old requests
        const validRequests = requests.filter(time => time > windowStart);
        this.requests.set(ip, validRequests);

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        validRequests.push(now);
        return true;
    }
}

// Enhanced Zoho Integration
class ZohoIntegration {
    constructor() {
        this.accessToken = CONFIG.zoho.accessToken;
    }

    async refreshAccessToken() {
        const body = querystring.stringify({
            grant_type: 'refresh_token',
            client_id: CONFIG.zoho.clientId,
            client_secret: CONFIG.zoho.clientSecret,
            refresh_token: CONFIG.zoho.refreshToken
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
                            this.accessToken = response.access_token;
                            console.log('🔄 Access token refreshed successfully');
                            resolve(response.access_token);
                        } else {
                            reject(new Error('Failed to refresh token'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    calculateLeadScore(formData, serviceType) {
        let score = 50; // Base score

        // Service type scoring
        if (serviceType === 'loan' && formData.loan_amount > 50000) score += 20;
        if (serviceType === 'credit_card' && formData.annual_income > 75000) score += 15;
        if (serviceType === 'insurance' && formData.coverage_amount > 100000) score += 10;

        // Contact completeness
        if (formData.phone) score += 10;
        if (formData.message) score += 5;

        return Math.min(score, 100);
    }

    async createLead(formData, serviceType) {
        const leadScore = this.calculateLeadScore(formData, serviceType);
        
        const leadData = {
            data: [{
                "First_Name": formData.first_name,
                "Last_Name": formData.last_name,
                "Email": formData.email,
                "Phone": formData.phone,
                "Lead_Source": "NGP Bank Website",
                "Company": "NGP Bank Lead",
                "Lead_Status": "Not Contacted",
                "Rating": leadScore >= 80 ? "Hot" : leadScore >= 60 ? "Warm" : "Cold",
                "Description": `Service Type: ${serviceType}\nLead Score: ${leadScore}/100\n${formData.message || ''}`,
            }]
        };

        // Add service-specific fields
        if (serviceType === 'loan') {
            leadData.data[0]["Description"] += `\nLoan Type: ${formData.loan_type}\nLoan Amount: $${formData.loan_amount}`;
        } else if (serviceType === 'credit_card') {
            leadData.data[0]["Description"] += `\nCard Type: ${formData.card_type}\nAnnual Income: $${formData.annual_income}`;
        } else if (serviceType === 'insurance') {
            leadData.data[0]["Description"] += `\nInsurance Type: ${formData.insurance_type}\nCoverage Amount: $${formData.coverage_amount}\nDate of Birth: ${formData.date_of_birth}`;
        }

        return new Promise(async (resolve) => {
            const postData = JSON.stringify(leadData);
            
            const options = {
                hostname: 'www.zohoapis.com',
                port: 443,
                path: '/crm/v2/Leads',
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
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
                        // Token expired, try to refresh
                        try {
                            await this.refreshAccessToken();
                            // Retry the request with new token
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

// Email Notifications
class EmailNotifier {
    constructor() {
        this.enabled = CONFIG.features.emailNotifications;
    }

    async sendNotification(leadData, serviceType, leadScore) {
        if (!this.enabled) return;

        console.log(`📧 Email notification: New ${serviceType} lead - ${leadData.first_name} ${leadData.last_name} (Score: ${leadScore})`);
        // Implement email sending logic here (SMTP, SendGrid, etc.)
    }

    async sendAutoResponse(email, serviceType) {
        if (!CONFIG.features.autoResponder) return;

        console.log(`📧 Auto-response sent to: ${email} for ${serviceType} inquiry`);
        // Implement auto-response logic here
    }
}

// Initialize components
const analytics = new Analytics();
const rateLimit = new RateLimit();
const zoho = new ZohoIntegration();
const emailNotifier = new EmailNotifier();

// Enhanced Server
const server = http.createServer(async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const parsedUrl = url.parse(req.url, true);

    // Rate limiting
    if (CONFIG.features.rateLimit && !rateLimit.isAllowed(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Too many requests' }));
        return;
    }

    // Analytics for page visits
    if (req.method === 'GET') {
        analytics.recordVisit(req);
    }

    // API Routes
    if (req.url.startsWith('/api/')) {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });

        if (req.url === '/api/stats') {
            res.end(JSON.stringify(analytics.getStats()));
            return;
        }

        if (req.url === '/api/health') {
            res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
            return;
        }
    }

    // Enhanced form submission
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
                    email: formData.email 
                });
                
                // Create lead in Zoho CRM
                const result = await zoho.createLead(formData, serviceType);
                
                // Record analytics
                analytics.recordFormSubmission(serviceType, result.success);
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': '*' 
                });
                
                if (result.success) {
                    console.log(`✅ Lead created successfully in Zoho CRM (Score: ${result.leadScore})`);
                    
                    // Send notifications
                    await emailNotifier.sendNotification(formData, serviceType, result.leadScore);
                    await emailNotifier.sendAutoResponse(formData.email, serviceType);
                    
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
                res.writeHead(500, { 'Content-Type': 'application/json' });
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

// Enhanced startup
function startServer(port) {
    server.listen(port, () => {
        console.log(`\n🏦 NGP Bank Enhanced Website`);
        console.log(`🌐 Running at: http://localhost:${port}`);
        console.log(`📊 Analytics: ${CONFIG.features.analytics ? 'Enabled' : 'Disabled'}`);
        console.log(`🔒 Rate Limiting: ${CONFIG.features.rateLimit ? 'Enabled' : 'Disabled'}`);
        console.log(`📧 Email Notifications: ${CONFIG.features.emailNotifications ? 'Enabled' : 'Disabled'}`);
        console.log(`🎯 Lead Scoring: ${CONFIG.features.leadScoring ? 'Enabled' : 'Disabled'}`);
        console.log(`⚡ Press Ctrl+C to stop the server\n`);
        
        // API endpoints
        console.log(`📊 Stats API: http://localhost:${port}/api/stats`);
        console.log(`💚 Health API: http://localhost:${port}/api/health\n`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(CONFIG.server.port);
