/**
 * Zoho CRM Function: Process Bank Lead
 * This function handles lead processing with bank-specific logic
 */

function processLead(leadData) {
    try {
        console.log("🏦 Processing bank lead:", leadData);
        
        // Validate required fields for bank leads
        const requiredFields = ['First_Name', 'Last_Name', 'Email', 'Phone'];
        const missingFields = requiredFields.filter(field => !leadData[field]);
        
        if (missingFields.length > 0) {
            return {
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            };
        }
        
        // Extract service type from description
        const description = leadData.Description || '';
        let serviceType = 'general';
        let priority = 'Medium';
        
        if (description.includes('Loan')) {
            serviceType = 'loan';
            priority = 'High';
        } else if (description.includes('Credit Card')) {
            serviceType = 'credit_card';
            priority = 'Medium';
        } else if (description.includes('Insurance')) {
            serviceType = 'insurance';
            priority = 'Low';
        }
        
        // Set lead owner based on service type
        let leadOwner = '';
        switch (serviceType) {
            case 'loan':
                leadOwner = 'loan-specialist@ngpbank.com';
                break;
            case 'credit_card':
                leadOwner = 'card-specialist@ngpbank.com';
                break;
            case 'insurance':
                leadOwner = 'insurance-specialist@ngpbank.com';
                break;
            default:
                leadOwner = 'general-sales@ngpbank.com';
        }
        
        // Update lead with processed data
        const updatedLead = {
            ...leadData,
            Priority: priority,
            Lead_Source: 'NGP Bank Website',
            Lead_Status: 'New',
            Industry: 'Banking & Financial Services',
            Service_Type: serviceType,
            Owner: {
                email: leadOwner
            }
        };
        
        // Log the processing
        console.log("✅ Lead processed successfully:", {
            name: `${leadData.First_Name} ${leadData.Last_Name}`,
            serviceType: serviceType,
            priority: priority,
            owner: leadOwner
        });
        
        return {
            success: true,
            data: updatedLead,
            message: 'Lead processed and routed successfully'
        };
        
    } catch (error) {
        console.error("❌ Error processing lead:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export for Zoho
if (typeof module !== 'undefined' && module.exports) {
    module.exports = processLead;
}
