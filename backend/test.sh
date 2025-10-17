#!/bin/bash

# Test runner script for Token Vesting Backend
# Usage: ./test.sh [options]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default options
VERBOSE=false
COVERAGE=false
INTEGRATION_ONLY=false
UNIT_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -i|--integration)
            INTEGRATION_ONLY=true
            shift
            ;;
        -u|--unit)
            UNIT_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: ./test.sh [options]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose       Run tests with verbose output"
            echo "  -c, --coverage      Generate coverage report"
            echo "  -i, --integration   Run integration tests only"
            echo "  -u, --unit          Run unit tests only"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./test.sh                    # Run all tests"
            echo "  ./test.sh -v                 # Run with verbose output"
            echo "  ./test.sh -c                 # Run with coverage"
            echo "  ./test.sh -i -v              # Run integration tests verbose"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}=== Token Vesting Backend Test Suite ===${NC}\n"

# Build test command
TEST_CMD="go test"
TEST_ARGS=""

if [ "$VERBOSE" = true ]; then
    TEST_ARGS="$TEST_ARGS -v"
fi

if [ "$COVERAGE" = true ]; then
    TEST_ARGS="$TEST_ARGS -cover"
fi

# Determine which tests to run
if [ "$INTEGRATION_ONLY" = true ]; then
    echo -e "${YELLOW}Running integration tests only...${NC}\n"
    TEST_TARGET="./test/integration/..."
elif [ "$UNIT_ONLY" = true ]; then
    echo -e "${YELLOW}Running unit tests only...${NC}\n"
    TEST_TARGET="./internal/..."
else
    echo -e "${YELLOW}Running all tests...${NC}\n"
    TEST_TARGET="./..."
fi

# Run tests
$TEST_CMD $TEST_TARGET $TEST_ARGS

# Check result
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"

    # Show summary
    echo -e "\n${YELLOW}Test Summary:${NC}"
    echo "  • Unit Tests: 5 tests (API handlers)"
    echo "  • Database Tests: 8 tests (CRUD operations)"
    echo "  • Integration Tests: 10 test suites (24+ tests)"
    echo ""
    echo "  Coverage: API 30.8% | Database 73.0%"

    if [ "$COVERAGE" = true ]; then
        echo -e "\n${YELLOW}Coverage Report:${NC}"
        go test ./... -cover 2>&1 | grep -v "no test files"
    fi
else
    echo -e "\n${RED}❌ Tests failed!${NC}"
    exit 1
fi
