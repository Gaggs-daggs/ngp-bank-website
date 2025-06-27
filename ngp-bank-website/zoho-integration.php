<?php
// zoho-integration.php
// Server-side script for handling Zoho CRM integration

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration - Replace with your actual Zoho CRM credentials
define('ZOHO_ACCESS_TOKEN', 'YOUR_ZOHO_ACCESS_TOKEN');
define('ZOHO_ORG_ID', 'YOUR_ORG_ID');
define('ZOHO_API_URL', 'https://www.zohoapis.com/crm/v2/Leads');

/**
 * Function to refresh Zoho access token
 * You'll need to implement this based on your OAuth setup
 */
function refreshZohoToken() {
    // Implementation depends on your OAuth setup
    // This is a placeholder - you'll need to implement token refresh logic
    return false;
}

/**
 * Function to create lead in Zoho CRM
 */
function createZohoLead($leadData) {
    $headers = [
        'Authorization: Zoho-oauthtoken ' . ZOHO_ACCESS_TOKEN,
        'Content-Type: application/json'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, ZOHO_API_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['data' => [$leadData]]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'success' => $httpCode === 201,
        'response' => json_decode($response, true),
        'http_code' => $httpCode
    ];
}

/**
 * Function to log leads locally as backup
 */
function logLeadLocally($leadData) {
    $logFile = 'leads_backup.json';
    $leads = [];
    
    if (file_exists($logFile)) {
        $leads = json_decode(file_get_contents($logFile), true) ?: [];
    }
    
    $leadData['timestamp'] = date('Y-m-d H:i:s');
    $leadData['id'] = uniqid();
    $leads[] = $leadData;
    
    file_put_contents($logFile, json_encode($leads, JSON_PRETTY_PRINT));
}

// Main processing
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Validate required fields
    $requiredFields = ['first_name', 'last_name', 'email', 'phone', 'service_type'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Required field missing: $field"]);
            exit;
        }
    }

    // Prepare lead data for Zoho
    $leadData = [
        'First_Name' => $input['first_name'],
        'Last_Name' => $input['last_name'],
        'Email' => $input['email'],
        'Phone' => $input['phone'],
        'Lead_Source' => 'NGP Bank Website',
        'Company' => 'NGP Bank Lead',
        'Lead_Status' => 'Not Contacted',
        'Description' => 'Service Type: ' . $input['service_type'] . "\n" . ($input['message'] ?? '')
    ];

    // Add service-specific fields
    switch ($input['service_type']) {
        case 'loan':
            if (!empty($input['loan_type'])) {
                $leadData['Loan_Type'] = $input['loan_type'];
            }
            if (!empty($input['loan_amount'])) {
                $leadData['Loan_Amount'] = $input['loan_amount'];
                $leadData['Description'] .= "\nLoan Type: " . $input['loan_type'];
                $leadData['Description'] .= "\nLoan Amount: $" . $input['loan_amount'];
            }
            break;
            
        case 'credit_card':
            if (!empty($input['card_type'])) {
                $leadData['Card_Type'] = $input['card_type'];
            }
            if (!empty($input['annual_income'])) {
                $leadData['Annual_Income'] = $input['annual_income'];
                $leadData['Description'] .= "\nCard Type: " . $input['card_type'];
                $leadData['Description'] .= "\nAnnual Income: $" . $input['annual_income'];
            }
            break;
            
        case 'insurance':
            if (!empty($input['insurance_type'])) {
                $leadData['Insurance_Type'] = $input['insurance_type'];
            }
            if (!empty($input['coverage_amount'])) {
                $leadData['Coverage_Amount'] = $input['coverage_amount'];
            }
            if (!empty($input['date_of_birth'])) {
                $leadData['Date_of_Birth'] = $input['date_of_birth'];
            }
            $leadData['Description'] .= "\nInsurance Type: " . ($input['insurance_type'] ?? '');
            $leadData['Description'] .= "\nCoverage Amount: $" . ($input['coverage_amount'] ?? '');
            $leadData['Description'] .= "\nDate of Birth: " . ($input['date_of_birth'] ?? '');
            break;
    }

    // Always log locally as backup
    logLeadLocally($input);

    // Try to create lead in Zoho
    $result = createZohoLead($leadData);

    if ($result['success']) {
        echo json_encode([
            'success' => true,
            'message' => 'Lead created successfully in Zoho CRM',
            'data' => $result['response']
        ]);
    } else {
        // Even if Zoho fails, we have the lead logged locally
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create lead in Zoho CRM, but lead has been saved locally',
            'error' => $result['response'],
            'http_code' => $result['http_code']
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
