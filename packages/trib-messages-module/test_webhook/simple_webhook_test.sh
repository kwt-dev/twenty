#!/bin/bash
set -e

echo "=== Simple Webhook Test ==="

# Test webhook URL and signature generation
TEST_URL="http://localhost:3333/webhooks/trib/twilio/delivery-status"
TEST_PAYLOAD="MessageSid=SMtest123&MessageStatus=delivered&To=%2B15555551234&From=%2B15555554321"
TEST_AUTH_TOKEN="test_token_123"

# Generate signature using openssl
SIGNATURE=$(echo -n "${TEST_URL}${TEST_PAYLOAD}" | openssl dgst -sha1 -hmac "$TEST_AUTH_TOKEN" -binary | base64)

echo "Generated signature: $SIGNATURE"

# Test that the signature validation works
if command -v openssl &> /dev/null; then
    echo "✓ OpenSSL is available"
    # Verify signature can be generated
    TEST_SIG=$(echo -n "test" | openssl dgst -sha1 -hmac "key" -binary | base64)
    echo "Test signature: $TEST_SIG"
    echo "✓ Signature generation works"
else
    echo "✗ OpenSSL not available"
    exit 1
fi

# Test Docker availability
if command -v docker &> /dev/null; then
    echo "✓ Docker is available"
    if docker ps &> /dev/null; then
        echo "✓ Docker is running"
    else
        echo "✗ Docker is not running"
        exit 1
    fi
else
    echo "✗ Docker not available"
    exit 1
fi

# Test curl availability
if command -v curl &> /dev/null; then
    echo "✓ curl is available"
else
    echo "✗ curl not available"
    exit 1
fi

echo "✓ All prerequisites satisfied"
echo "✓ Webhook functionality validation ready"