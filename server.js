const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Zoho Configuration
const ZOHO_CONFIG = {
    accessToken: '1000.e15e5e0fea0194e3d6ae666fd4209ba9.c043e3fa6b385b1479f6bc6d7172af08',
    apiUrl: 'https://www.zohoapis.com/crm/v2/Leads'
};

// Function to create lead in Zoho CRM
async function createZohoLead(formData, serviceType) {
    const leadData = {
        data: [{
            "First_Name": formData.first_name,
            "Last_Name": formData.last_name,
            "Email": formData.email,
            "Phone": formData.phone,
            "Lead_Source": "NGP Bank Website",
            "Company": "NGP Bank Lead",
            "Lead_Status": "Not Contacted",
            "Description": `Service Type: ${serviceType}\n${formData.message || ''}`,
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

    return new Promise((resolve, reject) => {
        const https = require('https');
        const postData = JSON.stringify(leadData);
        
        const options = {
            hostname: 'www.zohoapis.com',
            port: 443,
            path: '/crm/v2/Leads',
            method: 'POST',
            headers: {
                'Authorization': `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: JSON.parse(data) });
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

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
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
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Webhook processed successfully' }));
            } catch (error) {
                console.error('❌ Webhook processing error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    // Handle form submission
    if (req.method === 'POST' && parsedUrl.pathname === '/submit-form') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const formData = querystring.parse(body);
                const serviceType = formData.service_type;
                
                console.log('📝 Form submission received:', { serviceType, name: `${formData.first_name} ${formData.last_name}`, email: formData.email });
                
                // Create lead in Zoho CRM
                const result = await createZohoLead(formData, serviceType);
                
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                
                if (result.success) {
                    console.log('✅ Lead created successfully in Zoho CRM');
                    res.end(JSON.stringify({ success: true, message: 'Lead created successfully' }));
                } else {
                    console.log('❌ Failed to create lead in Zoho CRM:', result.error);
                    res.end(JSON.stringify({ success: false, error: result.error, statusCode: result.statusCode }));
                }
            } catch (error) {
                console.error('❌ Server error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Handle OAuth callback route
    if (req.url.startsWith('/oauth/callback')) {
        filePath = './oauth-callback.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content || 'Error 404: File Not Found', 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 3000;

function startServer(port) {
    server.listen(port, () => {
        console.log(`\n🏦 NGP Bank website is running at http://localhost:${port}`);
        console.log('🌐 Open your browser and visit the URL above');
        console.log('⚡ Press Ctrl+C to stop the server\n');
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);
