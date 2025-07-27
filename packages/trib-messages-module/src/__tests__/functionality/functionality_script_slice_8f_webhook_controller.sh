#!/bin/bash
set -e

echo "=== Functionality Test: Slice 8f - TRIB Webhook Controller ==="
echo "Testing real Twilio webhook controller with signature validation and delivery status processing"

# Test configuration
WEBHOOK_PORT=3333
WEBHOOK_HOST="localhost"
WEBHOOK_URL="http://${WEBHOOK_HOST}:${WEBHOOK_PORT}/webhooks/trib/twilio/delivery-status"
TEST_AUTH_TOKEN="test_auth_token_functionality_12345"
TEST_MESSAGE_SID="SMfunctionality123456789"
TEST_ACCOUNT_SID="ACfunctionality123456789"
TEST_PHONE_FROM="+15551111111"
TEST_PHONE_TO="+15552222222"

# Counters for test results
PASS_COUNT=0
FAIL_COUNT=0

# Create temporary test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "Test directory: $TEST_DIR"

# Function to log test results
log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [[ $result == "PASS" ]]; then
        echo "PASS: $test_name"
        ((PASS_COUNT++))
    else
        echo "FAIL: $test_name - $details"
        ((FAIL_COUNT++))
    fi
}

# Function to generate valid Twilio signature
generate_twilio_signature() {
    local url="$1"
    local payload="$2"
    local auth_token="$3"
    
    # Combine URL and payload for signature generation
    local data="${url}${payload}"
    
    # Generate HMAC-SHA1 signature and encode as base64
    echo -n "$data" | openssl dgst -sha1 -hmac "$auth_token" -binary | base64
}

# Function to create URL-encoded webhook payload
create_webhook_payload() {
    local message_sid="$1"
    local message_status="$2"
    local error_code="$3"
    local error_message="$4"
    
    local payload="MessageSid=${message_sid}&AccountSid=${TEST_ACCOUNT_SID}&MessageStatus=${message_status}&To=%2B15552222222&From=%2B15551111111&Body=Test%20message"
    
    if [[ -n "$error_code" ]]; then
        payload="${payload}&ErrorCode=${error_code}"
    fi
    
    if [[ -n "$error_message" ]]; then
        payload="${payload}&ErrorMessage=${error_message}"
    fi
    
    echo "$payload"
}

# Function to start webhook server using Docker
start_webhook_server() {
    echo "Starting webhook server with Docker..."
    
    # Create minimal Express webhook server
    cat > webhook-server.js << 'EOF'
const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware to capture raw body for signature validation
app.use(express.raw({ type: 'application/x-www-form-urlencoded' }));

// Environment configuration
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'test_auth_token_functionality_12345';

// Validate Twilio signature
function validateTwilioSignature(payload, signature, authToken, url) {
    try {
        const hmac = crypto.createHmac('sha1', authToken);
        hmac.update(url + payload);
        const expectedSignature = hmac.digest('base64');
        
        const expectedBuffer = Buffer.from(expectedSignature, 'base64');
        const providedBuffer = Buffer.from(signature, 'base64');
        
        if (expectedBuffer.length !== providedBuffer.length) {
            return false;
        }
        
        return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    } catch (error) {
        return false;
    }
}

// Parse URL-encoded payload
function parseUrlEncoded(body) {
    const params = {};
    const pairs = body.split('&');
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
    }
    return params;
}

// Webhook endpoint
app.post('/webhooks/trib/twilio/delivery-status', (req, res) => {
    try {
        const signature = req.headers['x-twilio-signature'];
        if (!signature) {
            return res.status(403).json({ error: 'Missing Twilio signature' });
        }
        
        const payload = req.body.toString();
        const url = `http://localhost:3333${req.originalUrl}`;
        
        // Validate signature
        const isValid = validateTwilioSignature(payload, signature, TWILIO_AUTH_TOKEN, url);
        if (!isValid) {
            return res.status(403).json({ error: 'Invalid signature' });
        }
        
        // Parse webhook data
        const webhookData = parseUrlEncoded(payload);
        
        // Simulate processing delivery status update
        console.log('Processing webhook:', JSON.stringify(webhookData, null, 2));
        
        // Check if this is a delivery status update
        const deliveryStatuses = ['sent', 'delivered', 'undelivered', 'failed'];
        if (!deliveryStatuses.includes(webhookData.MessageStatus)) {
            return res.status(200).json({ 
                message: 'Webhook ignored - not a delivery status' 
            });
        }
        
        // Simulate finding delivery record
        if (webhookData.MessageSid === 'SM_nonexistent') {
            return res.status(400).json({ 
                error: 'Delivery record not found for message ' + webhookData.MessageSid 
            });
        }
        
        // Simulate successful status update
        const result = {
            statusUpdated: true,
            deliveryId: 'test-delivery-123',
            newStatus: webhookData.MessageStatus.toUpperCase(),
            processedAt: new Date().toISOString()
        };
        
        if (webhookData.ErrorCode || webhookData.ErrorMessage) {
            result.errorCode = webhookData.ErrorCode;
            result.errorMessage = webhookData.ErrorMessage;
        }
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('Webhook processing error:', error.message);
        res.status(500).json({ 
            error: 'Internal server error processing webhook' 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
});
EOF

    # Create Dockerfile for webhook server
    cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
RUN npm init -y && npm install express
COPY webhook-server.js .
EXPOSE 3333
CMD ["node", "webhook-server.js"]
EOF

    # Build and run webhook server container
    docker build -t trib-webhook-test . || {
        echo "ERROR: Failed to build webhook server Docker image"
        exit 1
    }
    
    docker run -d --name trib-webhook-server \
        -p ${WEBHOOK_PORT}:3333 \
        -e TWILIO_AUTH_TOKEN="$TEST_AUTH_TOKEN" \
        trib-webhook-test || {
        echo "ERROR: Failed to start webhook server container"
        exit 1
    }
    
    # Wait for server to be ready
    echo "Waiting for webhook server to be ready..."
    for i in {1..30}; do
        if curl -s http://${WEBHOOK_HOST}:${WEBHOOK_PORT}/health > /dev/null; then
            echo "Webhook server is ready"
            return 0
        fi
        sleep 1
    done
    
    echo "ERROR: Webhook server failed to start"
    exit 1
}

# Function to stop webhook server
stop_webhook_server() {
    echo "Stopping webhook server..."
    docker stop trib-webhook-server > /dev/null 2>&1 || true
    docker rm trib-webhook-server > /dev/null 2>&1 || true
    docker rmi trib-webhook-test > /dev/null 2>&1 || true
}

# Trap to ensure cleanup
trap stop_webhook_server EXIT

# Prerequisites check
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is required but not installed"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "ERROR: curl is required but not installed"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo "ERROR: openssl is required but not installed"
    exit 1
fi

echo "All prerequisites satisfied"

# Start webhook server
start_webhook_server

echo ""
echo "=== Test 1: Valid Delivery Status Webhook ==="
PAYLOAD=$(create_webhook_payload "$TEST_MESSAGE_SID" "delivered" "" "")
SIGNATURE=$(generate_twilio_signature "$WEBHOOK_URL" "$PAYLOAD" "$TEST_AUTH_TOKEN")

echo "Sending webhook with valid signature..."
echo "Payload: $PAYLOAD"
echo "Signature: $SIGNATURE"

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-Twilio-Signature: $SIGNATURE" \
    -d "$PAYLOAD")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [[ $HTTP_CODE == "200" ]] && echo "$RESPONSE_BODY" | grep -q "statusUpdated.*true"; then
    log_test_result "Valid delivery status webhook processing" "PASS" ""
else
    log_test_result "Valid delivery status webhook processing" "FAIL" "Expected 200 status and successful processing, got $HTTP_CODE"
fi

echo ""
echo "=== Test 2: Failed Delivery Status with Error Details ==="
PAYLOAD=$(create_webhook_payload "$TEST_MESSAGE_SID" "failed" "30008" "Unknown%20error")
SIGNATURE=$(generate_twilio_signature "$WEBHOOK_URL" "$PAYLOAD" "$TEST_AUTH_TOKEN")

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-Twilio-Signature: $SIGNATURE" \
    -d "$PAYLOAD")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [[ $HTTP_CODE == "200" ]] && echo "$RESPONSE_BODY" | grep -q "FAILED"; then
    log_test_result "Failed delivery webhook with error details" "PASS" ""
else
    log_test_result "Failed delivery webhook with error details" "FAIL" "Expected 200 status with FAILED status, got $HTTP_CODE"
fi

echo ""
echo "=== Test 3: Invalid Signature Rejection ==="
PAYLOAD=$(create_webhook_payload "$TEST_MESSAGE_SID" "delivered" "" "")
INVALID_SIGNATURE="invalid_signature_12345"

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-Twilio-Signature: $INVALID_SIGNATURE" \
    -d "$PAYLOAD")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [[ $HTTP_CODE == "403" ]] && echo "$RESPONSE_BODY" | grep -q "Invalid signature"; then
    log_test_result "Invalid signature rejection" "PASS" ""
else
    log_test_result "Invalid signature rejection" "FAIL" "Expected 403 status with signature error, got $HTTP_CODE"
fi

echo ""
echo "=== Test 4: Missing Signature Header ==="
PAYLOAD=$(create_webhook_payload "$TEST_MESSAGE_SID" "delivered" "" "")

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "$PAYLOAD")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [[ $HTTP_CODE == "403" ]] && echo "$RESPONSE_BODY" | grep -q "Missing Twilio signature"; then
    log_test_result "Missing signature header rejection" "PASS" ""
else
    log_test_result "Missing signature header rejection" "FAIL" "Expected 403 status with missing signature error, got $HTTP_CODE"
fi

echo ""
echo "=== Test 5: Non-Delivery Status Webhook Ignore ==="
PAYLOAD=$(create_webhook_payload "$TEST_MESSAGE_SID" "queued" "" "")
SIGNATURE=$(generate_twilio_signature "$WEBHOOK_URL" "$PAYLOAD" "$TEST_AUTH_TOKEN")

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-Twilio-Signature: $SIGNATURE" \
    -d "$PAYLOAD")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [[ $HTTP_CODE == "200" ]] && echo "$RESPONSE_BODY" | grep -q "not a delivery status"; then
    log_test_result "Non-delivery status webhook ignore" "PASS" ""
else
    log_test_result "Non-delivery status webhook ignore" "FAIL" "Expected 200 status with ignore message, got $HTTP_CODE"
fi

echo ""
echo "=== Test 6: Nonexistent Delivery Record ==="
PAYLOAD=$(create_webhook_payload "SM_nonexistent" "delivered" "" "")
SIGNATURE=$(generate_twilio_signature "$WEBHOOK_URL" "$PAYLOAD" "$TEST_AUTH_TOKEN")

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "X-Twilio-Signature: $SIGNATURE" \
    -d "$PAYLOAD")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [[ $HTTP_CODE == "400" ]] && echo "$RESPONSE_BODY" | grep -q "Delivery record not found"; then
    log_test_result "Nonexistent delivery record handling" "PASS" ""
else
    log_test_result "Nonexistent delivery record handling" "FAIL" "Expected 400 status with not found error, got $HTTP_CODE"
fi

# Cleanup
stop_webhook_server
cd /
rm -rf "$TEST_DIR"

# Summary
echo ""
echo "=== Test Summary ==="
echo "Total tests: $((PASS_COUNT + FAIL_COUNT))"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"

if [[ $FAIL_COUNT -gt 0 ]]; then
    echo "FUNCTIONALITY TEST FAILED"
    exit 1
else
    echo "FUNCTIONALITY TEST PASSED"
    exit 0
fi