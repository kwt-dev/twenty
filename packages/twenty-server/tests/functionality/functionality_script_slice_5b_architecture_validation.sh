#!/bin/bash
# Functionality Script: Slice 5b - Architecture Violation Fix & Validation
# Purpose: Verify architectural violations are removed and correct patterns implemented
# Created: $(date)
# CRITICAL: NO mocking - validate real architecture compliance

set -e  # Exit on any error

echo "=== Functionality Script: Slice 5b - Architecture Violation Fix & Validation ==="
echo "Purpose: Validate architectural violations removed and correct patterns implemented"
echo "Project: Twenty CRM TRIB SMS architecture compliance"
echo "Location: /Users/spensermcconnell/__Active_Code/TintMeta_Alpha/backend/twenty/packages/twenty-server"
echo "Approach: Real architecture validation (no mocking)"
echo "Timestamp: $(date)"
echo

# Prerequisites check
echo "Checking prerequisites..."

# ENSURE we are in the correct directory
pwd
EXPECTED_DIR="/Users/spensermcconnell/__Active_Code/TintMeta_Alpha/backend/twenty/packages/twenty-server"
if [ "$(pwd)" != "$EXPECTED_DIR" ]; then
    echo "ERROR: Wrong directory. Expected: $EXPECTED_DIR"
    echo "Current: $(pwd)"
    echo "Please navigate to the correct directory"
    exit 1
fi
echo "✅ Directory verified: $(pwd)"

# Check Node.js and yarn
if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js not available"
    exit 1
fi

if ! command -v yarn >/dev/null 2>&1; then
    echo "ERROR: yarn not available - this project uses yarn 4.9.2"
    exit 1
fi

echo "Prerequisites verified for Twenty CRM project"

# Architecture Validation Phase
echo "Validating architecture compliance..."

PASSED_TESTS=0
TOTAL_TESTS=0

echo ""
echo "Architecture Test 1: Verify Architectural Violations Removed"
echo "Expected: PersonRepository and TribModule violations completely removed"
echo "Executing validation:"

# Check that architectural violations are removed
VIOLATIONS_FOUND=0

if [ -f "src/repositories/person.repository.twenty.ts" ]; then
    echo "❌ VIOLATION: PersonRepository still exists"
    ((VIOLATIONS_FOUND++))
fi

if [ -f "src/modules/trib/trib.module.ts" ]; then
    echo "❌ VIOLATION: Custom TribModule still exists"
    ((VIOLATIONS_FOUND++))
fi

if [ -f "src/database/migrations/add-phone-indices-for-trib-sms.migration.ts" ]; then
    echo "❌ VIOLATION: Associated migration still exists"
    ((VIOLATIONS_FOUND++))
fi

if [ $VIOLATIONS_FOUND -eq 0 ]; then
    echo "Status: PASS - All architectural violations removed"
    ((PASSED_TESTS++))
else
    echo "Status: FAIL - $VIOLATIONS_FOUND architectural violations remain"
fi
((TOTAL_TESTS++))

echo ""
echo "Architecture Test 2: Verify Correct Architecture Intact"
echo "Expected: TribWorkspaceService and TribMessagesModule.forRoot() pattern preserved"
echo "Executing validation:"

CORRECT_PATTERNS=0

if [ -f "src/modules/trib/services/trib-workspace.service.ts" ]; then
    echo "✅ TribWorkspaceService exists (correct bridge service)"
    ((CORRECT_PATTERNS++))
else
    echo "❌ TribWorkspaceService missing"
fi

if grep -q "TribMessagesModule.forRoot" "src/modules/modules.module.ts"; then
    echo "✅ TribMessagesModule.forRoot() pattern intact"
    ((CORRECT_PATTERNS++))
else
    echo "❌ TribMessagesModule.forRoot() pattern missing"
fi

if grep -q "TribWorkspaceService" "src/modules/modules.module.ts"; then
    echo "✅ TribWorkspaceService properly exported"
    ((CORRECT_PATTERNS++))
else
    echo "❌ TribWorkspaceService export missing"
fi

if [ $CORRECT_PATTERNS -eq 3 ]; then
    echo "Status: PASS - Correct architecture patterns intact"
    ((PASSED_TESTS++))
else
    echo "Status: FAIL - $((3 - CORRECT_PATTERNS)) correct patterns missing"
fi
((TOTAL_TESTS++))

echo ""
echo "Architecture Test 3: Verify Enhanced TribWorkspaceService Compliance"
echo "Expected: REQUEST scope and proper ORM patterns in enhanced service"
echo "Executing validation:"

COMPLIANCE_CHECKS=0

if grep -q "@Injectable({ scope: Scope.REQUEST })" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ REQUEST scope properly configured"
    ((COMPLIANCE_CHECKS++))
else
    echo "❌ REQUEST scope missing or incorrect"
fi

if grep -q "TwentyORMGlobalManager" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ TwentyORMGlobalManager pattern used"
    ((COMPLIANCE_CHECKS++))
else
    echo "❌ TwentyORMGlobalManager pattern missing"
fi

if grep -q "ScopedWorkspaceContextFactory" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ ScopedWorkspaceContextFactory pattern used"
    ((COMPLIANCE_CHECKS++))
else
    echo "❌ ScopedWorkspaceContextFactory pattern missing"
fi

if ! grep -q "TwentyORMManager[^G]" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ No incorrect ORM manager usage"
    ((COMPLIANCE_CHECKS++))
else
    echo "❌ Incorrect ORM manager found"
fi

if [ $COMPLIANCE_CHECKS -eq 4 ]; then
    echo "Status: PASS - Enhanced service follows correct architecture"
    ((PASSED_TESTS++))
else
    echo "Status: FAIL - $((4 - COMPLIANCE_CHECKS)) compliance issues found"
fi
((TOTAL_TESTS++))

echo ""
echo "Architecture Test 4: Verify Enhanced Phone Lookup Methods"
echo "Expected: findPersonByPhone and findPeopleByPhoneVariations methods with security"
echo "Executing validation:"

PHONE_METHODS=0

if grep -q "findPersonByPhone" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ findPersonByPhone method exists"
    ((PHONE_METHODS++))
else
    echo "❌ findPersonByPhone method missing"
fi

if grep -q "findPeopleByPhoneVariations" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ findPeopleByPhoneVariations method exists"
    ((PHONE_METHODS++))
else
    echo "❌ findPeopleByPhoneVariations method missing"
fi

if grep -q "normalizePhoneNumber" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ Phone normalization utility imported"
    ((PHONE_METHODS++))
else
    echo "❌ Phone normalization utility missing"
fi

if grep -q "securityLogger" "src/modules/trib/services/trib-workspace.service.ts"; then
    echo "✅ Security logging implemented"
    ((PHONE_METHODS++))
else
    echo "❌ Security logging missing"
fi

if [ $PHONE_METHODS -eq 4 ]; then
    echo "Status: PASS - Enhanced phone lookup methods implemented"
    ((PASSED_TESTS++))
else
    echo "Status: FAIL - $((4 - PHONE_METHODS)) phone lookup features missing"
fi
((TOTAL_TESTS++))

echo ""
echo "Architecture Test 5: Build Validation"
echo "Expected: Clean builds without architectural conflicts"
echo "Executing validation:"

# Test that the build succeeds with architectural fixes
if npx tsc --noEmit > /tmp/typecheck.log 2>&1; then
    echo "Status: PASS - TypeScript compilation successful"
    ((PASSED_TESTS++))
else
    echo "Status: FAIL - TypeScript compilation failed"
    echo "Build errors:"
    cat /tmp/typecheck.log
fi
((TOTAL_TESTS++))

echo ""
echo "=== Functionality Script Summary ==="
echo "Total architecture tests run: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo "Project: Twenty CRM TRIB SMS architecture compliance"
echo "Testing approach: Real architecture validation (no mocking)"
echo "Timestamp: $(date)"

if [[ $PASSED_TESTS -eq $TOTAL_TESTS ]]; then
    echo "ALL ARCHITECTURE TESTS PASSED - Twenty CRM TRIB SMS architecture compliant"
    exit 0
else
    echo "SOME ARCHITECTURE TESTS FAILED - Architecture compliance issues need resolution"
    exit 1
fi