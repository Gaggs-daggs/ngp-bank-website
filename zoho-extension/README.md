# NGP Bank Zoho CRM Extension

This extension integrates your NGP Bank website with Zoho CRM to provide enhanced lead management and automatic routing.

## Features

- 🔄 **Webhook Integration**: Automatically receives notifications when leads are created, updated, or deleted
- 🎯 **Smart Lead Routing**: Routes leads to appropriate specialists based on service type
- ⚡ **Real-time Processing**: Instant lead processing and validation
- 📊 **Service-based Prioritization**: Automatically sets priority based on banking service type

## Installation Steps

### 1. Deploy Your Bank Website
First, make sure your bank website is deployed and accessible online:

```bash
# Start your development server
node server.js
```

Or deploy to a hosting platform (Railway, Render, Vercel, etc.)

### 2. Configure Zoho Webhook
In your Zoho Developer portal:

1. Go to **Workflow** → **Webhooks**
2. Set the **URL to Notify** to: `https://your-domain.com/webhook/zoho`
3. Set **Method** to `POST`
4. Select **Module**: `Leads`
5. Save the webhook configuration

### 3. Upload Extension to Zoho
1. Zip the entire `zoho-extension` folder
2. Go to Zoho Developer portal
3. Create a new extension
4. Upload the zipped extension files
5. Configure the settings:
   - **Webhook URL**: Your bank website webhook endpoint
   - **Lead Routing**: Enable for automatic routing

### 4. Test the Integration
1. Submit a form on your bank website
2. Check if the lead appears in Zoho CRM
3. Verify that webhook notifications are received

## Webhook URL Configuration

Based on your deployment platform, use one of these webhook URLs:

- **Local Development**: `http://localhost:3000/webhook/zoho`
- **Railway**: `https://your-app.railway.app/webhook/zoho`
- **Render**: `https://your-app.onrender.com/webhook/zoho`
- **Vercel**: `https://your-app.vercel.app/webhook/zoho`

## Service Type Routing

The extension automatically routes leads based on service type:

| Service Type | Priority | Routed To |
|-------------|----------|-----------|
| Loan | High | loan-specialist@ngpbank.com |
| Credit Card | Medium | card-specialist@ngpbank.com |
| Insurance | Low | insurance-specialist@ngpbank.com |
| General | Medium | general-sales@ngpbank.com |

## Customization

### Adding New Service Types
Edit the `processLead.js` function to add new service types:

```javascript
if (description.includes('Investment')) {
    serviceType = 'investment';
    priority = 'High';
    leadOwner = 'investment-advisor@ngpbank.com';
}
```

### Modifying Lead Fields
Update the `requiredFields` array in `processLead.js` to change validation rules.

## Troubleshooting

### Webhook Not Receiving Data
1. Check that your website is accessible from the internet
2. Verify the webhook URL is correct in Zoho
3. Check server logs for webhook errors

### Leads Not Being Created
1. Verify your Zoho access token is valid
2. Check the Zoho API rate limits
3. Review the server console for error messages

## Support

For technical support, check the server logs or contact your development team.
