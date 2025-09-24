#!/bin/bash

# Health check script for ShiftBay monorepo

set -e

echo "🏥 ShiftBay Health Check"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Function to check if port is open
check_port() {
    local name=$1
    local port=$2
    
    echo -n "Checking $name port $port... "
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ Open${NC}"
        return 0
    else
        echo -e "${RED}✗ Closed${NC}"
        return 1
    fi
}

# Check if services are running
echo "🔍 Checking Services:"
echo "-------------------"

API_HEALTHY=false
WEB_HEALTHY=false

# Check API
if check_port "API" 8000; then
    if check_service "API Health" "http://localhost:8000/docs"; then
        API_HEALTHY=true
    fi
else
    echo -e "${YELLOW}API not running on port 8000${NC}"
fi

# Check Web
if check_port "Web" 8080; then
    if check_service "Web Health" "http://localhost:8080"; then
        WEB_HEALTHY=true
    fi
else
    echo -e "${YELLOW}Web not running on port 8080${NC}"
fi

echo ""
echo "📊 Summary:"
echo "----------"

if [ "$API_HEALTHY" = true ]; then
    echo -e "API:  ${GREEN}✓ Healthy${NC} - http://localhost:8000"
    echo -e "Docs: ${GREEN}✓ Available${NC} - http://localhost:8000/docs"
else
    echo -e "API:  ${RED}✗ Unhealthy${NC}"
    echo "      Try: npm run api:dev"
fi

if [ "$WEB_HEALTHY" = true ]; then
    echo -e "Web:  ${GREEN}✓ Healthy${NC} - http://localhost:8080"
else
    echo -e "Web:  ${RED}✗ Unhealthy${NC}"
    echo "      Try: npm run web:dev"
fi

echo ""

# Check database connection (if API is running)
if [ "$API_HEALTHY" = true ]; then
    echo "🗄️ Database Check:"
    echo "-----------------"
    # You can add a database health endpoint to your API
    # For now, we'll just indicate it should be checked
    echo -e "${YELLOW}ℹ Database health should be checked via API endpoint${NC}"
    echo "  Consider adding: GET /health/db to your API"
fi

echo ""

# Overall status
if [ "$API_HEALTHY" = true ] && [ "$WEB_HEALTHY" = true ]; then
    echo -e "🎉 ${GREEN}All services are healthy!${NC}"
    exit 0
else
    echo -e "⚠️  ${YELLOW}Some services need attention${NC}"
    echo ""
    echo "Quick fixes:"
    echo "- Start all: npm run dev"
    echo "- Start API: npm run api:dev"
    echo "- Start Web: npm run web:dev"
    echo "- Check logs: npm run docker:logs"
    exit 1
fi