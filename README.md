# NGP Bank Website

A complete bank website with three main service areas (Loans, Credit Cards, Insurance) that automatically creates leads in Zoho CRM when users submit forms.

## Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Three Service Areas**: 
  - Loans (Personal, Home, Business)
  - Credit Cards (Platinum, Gold, Silver)
  - Insurance (Life, Health, Auto, Home)
- **Zoho CRM Integration**: Automatically creates leads when forms are submitted
- **Fallback System**: Saves leads locally if Zoho API is unavailable
- **Professional UI**: Clean, modern design with smooth scrolling and animations

## Files Structure

```
ngp-bank-website/
├── index.html          # Main website page
├── styles.css          # Stylesheet
├── script.js           # Frontend JavaScript with Zoho integration
├── zoho-integration.php # Backend PHP script for server-side Zoho integration
├── README.md           # This file
└── leads_backup.json   # Auto-generated backup file for leads
```

## Setup Instructions

### 1. Zoho CRM Setup

1. **Create a Zoho CRM Account** (if you don't have one)
   - Go to https://www.zoho.com/crm/
   - Sign up for an account

2. **Create a Server-based Application**
   - Go to https://api-console.zoho.com/
   - Click "Add Client"
   - Choose "Server-based Applications"
   - Fill in your details:
     - Client Name: NGP Bank Website
     - Homepage URL: Your website URL
     - Authorized Redirect URI: Your website URL + callback path

3. **Get Your Credentials**
   - Note down your Client ID and Client Secret
   - You'll need these for generating access tokens

4. **Generate Access Token**
   - Follow Zoho's OAuth 2.0 flow to get an access token
   - You can use tools like Postman or implement the OAuth flow
   - The access token will be used in your configuration

### 2. Website Configuration

#### Option A: Client-Side Only (JavaScript)

1. **Edit script.js**
   ```javascript
   const ZOHO_CONFIG = {
       accessToken: 'YOUR_ACTUAL_ZOHO_ACCESS_TOKEN',
       orgId: 'YOUR_ORG_ID',
       apiUrl: 'https://www.zohoapis.com/crm/v2/Leads'
   };
   ```

2. **Note**: This approach has CORS limitations. Zoho may block direct browser requests.

#### Option B: Server-Side (Recommended)

1. **Set up a web server** with PHP support (Apache, Nginx, etc.)

2. **Edit zoho-integration.php**
   ```php
   define('ZOHO_ACCESS_TOKEN', 'YOUR_ACTUAL_ZOHO_ACCESS_TOKEN');
   define('ZOHO_ORG_ID', 'YOUR_ORG_ID');
   ```

3. **Update script.js** to use your PHP endpoint instead of direct Zoho API calls:
   ```javascript
   // Replace the createZohoLead function to call your PHP script
   async function createZohoLead(formData, serviceType) {
       try {
           const response = await fetch('/zoho-integration.php', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify(formData)
           });
           
           return await response.json();
       } catch (error) {
           console.error('Error:', error);
           return { success: false, error: error.message };
       }
   }
   ```

### 3. Zoho CRM Field Mapping

Make sure your Zoho CRM has these fields (or modify the code to match your fields):

**Standard Fields:**
- First_Name
- Last_Name
- Email
- Phone
- Company
- Lead_Source
- Lead_Status
- Description

**Custom Fields (create these in Zoho):**
- Loan_Type
- Loan_Amount
- Card_Type
- Annual_Income
- Insurance_Type
- Coverage_Amount
- Date_of_Birth

### 4. Testing

1. **Open the website** in your browser
2. **Fill out any of the forms** (Loans, Credit Cards, Insurance)
3. **Submit the form**
4. **Check your Zoho CRM** for the new lead
5. **Check browser console** for any errors
6. **Check leads_backup.json** for locally saved leads

## Customization

### Adding New Service Types

1. **Add a new section** to index.html
2. **Create a new form** with appropriate fields
3. **Update script.js** to handle the new service type
4. **Update zoho-integration.php** for server-side processing

### Styling Changes

- Edit `styles.css` to change colors, fonts, layout
- The design is responsive and uses CSS Grid for layouts

### Form Fields

- Add/remove fields in the HTML forms
- Update the JavaScript validation and submission logic
- Update the Zoho CRM integration to handle new fields

## Security Considerations

1. **Never expose your Zoho access token** in client-side code
2. **Use HTTPS** for your website
3. **Validate and sanitize** all form inputs
4. **Implement rate limiting** to prevent spam
5. **Use environment variables** for sensitive configuration

## Troubleshooting

### Common Issues

1. **CORS Errors**: Use the server-side PHP approach instead of direct client-side calls
2. **Access Token Expired**: Implement token refresh logic
3. **Fields Not Mapping**: Check field names match exactly in Zoho CRM
4. **Forms Not Submitting**: Check browser console for JavaScript errors

### Debug Mode

Add this to script.js for detailed logging:
```javascript
const DEBUG = true;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log('[NGP Bank Debug]', message, data);
    }
}
```

## Support

For issues with:
- **Zoho CRM API**: Check Zoho's developer documentation
- **Website Functionality**: Check browser console for errors
- **Server Setup**: Ensure PHP and curl extension are enabled

## License

This project is provided as-is for educational and commercial use.
