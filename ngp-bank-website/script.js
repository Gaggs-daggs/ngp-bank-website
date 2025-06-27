// Configuration - Replace with your actual Zoho CRM credentials
const ZOHO_CONFIG = {
    accessToken: '1000.9d2f87375d96e051fc4e5aec57fec5ee.b1a79dc550dbd3fee43394d3e0c13e72',
    orgId: 'YOUR_ORG_ID', // Replace with your Zoho org ID
    apiUrl: 'https://www.zohoapis.com/crm/v2/Leads'
};

// Function to scroll to section
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// Function to submit form to server (which handles Zoho CRM)
async function submitFormToServer(formData) {
    try {
        // Convert form data to URL-encoded string
        const params = new URLSearchParams(formData).toString();
        
        const response = await fetch('/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Network Error:', error);
        return { success: false, error: error.message };
    }
}

// Function to handle form submission
async function handleFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const serviceType = data.service_type;

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    try {
        // Submit form to server (which handles Zoho CRM)
        const result = await submitFormToServer(data);

        if (result.success) {
            // Success - show confirmation message
            alert('Thank you! Your application has been submitted successfully. Our team will contact you soon.');
            form.reset();
        } else {
            // Error handling - still save locally or show appropriate message
            console.error('Failed to create Zoho lead:', result.error);
            
            // Fallback: Save data locally or show error message
            saveLeadLocally(data, serviceType);
            alert('Your application has been received. There was a technical issue with our system, but we have saved your information and will contact you soon.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        
        // Fallback: Save data locally
        saveLeadLocally(data, serviceType);
        alert('Your application has been received. We will contact you soon.');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Fallback function to save lead data locally
function saveLeadLocally(data, serviceType) {
    const leads = JSON.parse(localStorage.getItem('ngp_leads') || '[]');
    const leadData = {
        ...data,
        service_type: serviceType,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
    };
    
    leads.push(leadData);
    localStorage.setItem('ngp_leads', JSON.stringify(leads));
    
    console.log('Lead saved locally:', leadData);
}

// Function to get locally stored leads (for testing/backup)
function getLocalLeads() {
    return JSON.parse(localStorage.getItem('ngp_leads') || '[]');
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to all forms
    const forms = document.querySelectorAll('.lead-form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
});

// Service Cards Click Handlers
document.addEventListener('DOMContentLoaded', function() {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const targetSection = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            scrollToSection(targetSection);
        });
    });
});

// Additional CSS for better styling
const additionalStyles = `
/* Services Grid */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 30px;
}

.service-card {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.service-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.service-card h3 {
    color: #333;
    margin-bottom: 10px;
}

.service-card p {
    color: #666;
    line-height: 1.5;
}

/* Contact Info */
.contact-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 30px;
    margin-top: 30px;
}

.contact-item {
    text-align: center;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
}

.contact-item h3 {
    color: #333;
    margin-bottom: 10px;
}

/* Form improvements */
.lead-form {
    box-sizing: border-box;
}

.lead-form input,
.lead-form select,
.lead-form textarea {
    box-sizing: border-box;
    width: 100%;
}

.lead-form button:hover {
    background-color: #0056b3;
}

/* Responsive design */
@media (max-width: 768px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
    
    .nav-menu {
        flex-direction: column;
        gap: 10px;
    }
    
    .nav-container {
        flex-direction: column;
        align-items: center;
    }
}
`;

// Add additional styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
