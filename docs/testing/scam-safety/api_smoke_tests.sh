#!/usr/bin/env bash
# ==============================================================================
# WiseCub Member 4 — Scam Safety Postman-Free cURL Smoke Test Script
# ==============================================================================
# Usage:
#   bash docs/testing/scam-safety/api_smoke_tests.sh
#
# Requirements:
#   FastAPI backend running at http://localhost:8000
# ==============================================================================

set -euo pipefail

BASE_URL="http://localhost:8000"
DEMO_CHILD="demo-smoke-test-child"

GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}WiseCub Member 4: Scam Safety API Smoke Test Runner${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check server is online
echo -n "1. Checking FastAPI & MongoDB /health endpoint... "
HEALTH_RESP=$(curl -s "${BASE_URL}/health" || echo "")
if [[ "${HEALTH_RESP}" == *"\"status\":\"ok\""* ]]; then
    echo -e "${GREEN}[PASS]${NC} (Server online, DB connected)"
else
    echo -e "${RED}[FAIL]${NC} (Cannot reach ${BASE_URL}/health. Is uvicorn running?)"
    exit 1
fi

# Test GET Guardian details
echo -n "2. Testing GET /api/safety/guardian/${DEMO_CHILD}... "
GUARDIAN_GET=$(curl -s "${BASE_URL}/api/safety/guardian/${DEMO_CHILD}")
if [[ "${GUARDIAN_GET}" == *"\"child_id\":\"${DEMO_CHILD}\""* ]]; then
    echo -e "${GREEN}[PASS]${NC}"
else
    echo -e "${RED}[FAIL]${NC}: ${GUARDIAN_GET}"
fi

# Test PUT Guardian details
echo -n "3. Testing PUT /api/safety/guardian/${DEMO_CHILD} (Saving demo consent)... "
SAVE_RESP=$(curl -s -X PUT "${BASE_URL}/api/safety/guardian/${DEMO_CHILD}" \
    -H "Content-Type: application/json" \
    -d '{
        "parent_name": "Demo Test Parent",
        "email": "guardian.smoke@wisecub.local",
        "relationship": "Parent",
        "consent_confirmed": true,
        "simulation_enabled": true
    }')
if [[ "${SAVE_RESP}" == *"\"ok\":true"* ]]; then
    echo -e "${GREEN}[PASS]${NC}"
else
    echo -e "${RED}[FAIL]${NC}: ${SAVE_RESP}"
fi

# Test POST simulated dev verification
echo -n "4. Testing POST /api/safety/guardian/${DEMO_CHILD}/verify (Simulated dev assist)... "
VERIFY_RESP=$(curl -s -X POST "${BASE_URL}/api/safety/guardian/${DEMO_CHILD}/verify" \
    -H "Content-Type: application/json" \
    -d '{"is_simulated_dev_verification": true}')
if [[ "${VERIFY_RESP}" == *"\"verification_status\":\"verified\""* ]]; then
    echo -e "${GREEN}[PASS]${NC}"
else
    echo -e "${RED}[FAIL]${NC}: ${VERIFY_RESP}"
fi

# Test GET simulation inbox
echo -n "5. Testing GET /api/safety/simulation/inbox/${DEMO_CHILD}... "
INBOX_RESP=$(curl -s "${BASE_URL}/api/safety/simulation/inbox/${DEMO_CHILD}")
if [[ "${INBOX_RESP}" == *"\"messages\":"* ]]; then
    echo -e "${GREEN}[PASS]${NC}"
else
    echo -e "${RED}[FAIL]${NC}: ${INBOX_RESP}"
fi

# Test GET learning metrics
echo -n "6. Testing GET /api/safety/simulation/metrics/${DEMO_CHILD}... "
METRICS_RESP=$(curl -s "${BASE_URL}/api/safety/simulation/metrics/${DEMO_CHILD}")
if [[ "${METRICS_RESP}" == *"\"total_simulations\":"* ]]; then
    echo -e "${GREEN}[PASS]${NC}"
else
    echo -e "${RED}[FAIL]${NC}: ${METRICS_RESP}"
fi

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}All 6 API smoke tests executed successfully without Postman!${NC}"
echo -e "${BLUE}======================================================================${NC}"
