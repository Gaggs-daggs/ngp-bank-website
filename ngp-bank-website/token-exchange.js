const https = require('https');
const querystring = require('querystring');

// Your Self Client credentials
const CLIENT_ID = '1000.S6RJE8WU68V4G517VDGM7FZNOXDIAD';
const CLIENT_SECRET = '4c2a9748f6d6f5cc57ba3937dad4f20f7d1a9ad0cb';
const SCOPE = 'ZohoCRM.modules.ALL';

function getAccessToken() {
    const postData = querystring.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: SCOPE
    });

    // Try different data centers
    const datacenters = ['accounts.zoho.com', 'accounts.zoho.in', 'accounts.zoho.eu'];
    
    function tryDatacenter(index) {
        if (index >= datacenters.length) {
            console.log('❌ All datacenters failed. Please get token from Zoho console directly.');
            return;
        }
        
        const options = {
            hostname: datacenters[index],
            port: 443,
            path: '/oauth/v2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        console.log(`🔄 Trying datacenter: ${datacenters[index]}`);
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.access_token) {
                        console.log('\n✅ SUCCESS! Access token received:');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('ACCESS TOKEN:', response.access_token);
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('EXPIRES IN:', response.expires_in, 'seconds');
                        updateWebsiteConfig(response.access_token);
                    } else {
                        console.log(`❌ Error from ${datacenters[index]}:`, data);
                        tryDatacenter(index + 1);
                    }
                } catch (error) {
                    console.log(`❌ Parse error from ${datacenters[index]}:`, error.message);
                    tryDatacenter(index + 1);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Network error from ${datacenters[index]}:`, error.message);
            tryDatacenter(index + 1);
        });
        
        req.write(postData);
        req.end();
    }
    
    tryDatacenter(0);
}

function updateWebsiteConfig(accessToken) {
    const fs = require('fs');
    
    try {
        // Read the current script.js file
        let scriptContent = fs.readFileSync('./script.js', 'utf8');
        
        // Replace the access token in the configuration
        const updatedContent = scriptContent.replace(
            /accessToken: '[^']*'/,
            `accessToken: '${accessToken}'`
        );
        
        // Write the updated content back
        fs.writeFileSync('./script.js', updatedContent);
        
        console.log('\n🔧 Website configuration updated successfully!');
        console.log('✅ Your NGP Bank website is now ready to create leads in Zoho CRM!');
        console.log('\n🚀 Next steps:');
        console.log('1. Go to http://localhost:3000');
        console.log('2. Fill out any form (Loans, Credit Cards, or Insurance)');
        console.log('3. Submit the form to test Zoho CRM integration');
        
    } catch (error) {
        console.log('\n⚠️  Could not automatically update configuration:', error.message);
        console.log('Please manually update script.js with the access token above.');
    }
}

// Run the token exchange
getAccessToken();
