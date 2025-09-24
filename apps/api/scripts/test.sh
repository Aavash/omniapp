#!/bin/bash

# Test automation script for local development
set -e

echo "🧪 Running EMS Backend Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    print_error "uv is not installed. Please install it first: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

# Parse command line arguments
FAST_ONLY=false
COVERAGE_ONLY=false
LINT_ONLY=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --fast)
            FAST_ONLY=true
            shift
            ;;
        --coverage)
            COVERAGE_ONLY=true
            shift
            ;;
        --lint)
            LINT_ONLY=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --fast      Run only fast tests (unit tests)"
            echo "  --coverage  Run tests with coverage report only"
            echo "  --lint      Run only linting checks"
            echo "  -v, --verbose  Verbose output"
            echo "  -h, --help  Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set up test environment
if [ ! -f ".env" ]; then
    print_warning "No .env file found, copying from tests/.env.test"
    cp tests/.env.test .env
fi

# Run linting
if [ "$LINT_ONLY" = true ] || [ "$FAST_ONLY" = false ] && [ "$COVERAGE_ONLY" = false ]; then
    echo ""
    echo "🔍 Running Code Quality Checks"
    echo "------------------------------"
    
    print_status "Running ruff linting..."
    if uv run ruff check .; then
        print_status "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
    
    print_status "Checking code formatting..."
    if uv run ruff format --check .; then
        print_status "Code formatting is correct"
    else
        print_error "Code formatting issues found. Run 'uv run ruff format .' to fix"
        exit 1
    fi
fi

# Exit if only linting was requested
if [ "$LINT_ONLY" = true ]; then
    print_status "Linting complete!"
    exit 0
fi

# Run tests
echo ""
echo "🧪 Running Tests"
echo "----------------"

# Build test command
TEST_CMD="uv run python -m pytest"

if [ "$VERBOSE" = true ]; then
    TEST_CMD="$TEST_CMD -v"
fi

if [ "$FAST_ONLY" = true ]; then
    TEST_CMD="$TEST_CMD -m 'not slow and not integration'"
    print_status "Running fast tests only..."
elif [ "$COVERAGE_ONLY" = true ]; then
    TEST_CMD="$TEST_CMD --cov=app --cov-report=html --cov-report=term-missing"
    print_status "Running tests with coverage..."
else
    TEST_CMD="$TEST_CMD --cov=app --cov-report=html --cov-report=term-missing"
    print_status "Running full test suite with coverage..."
fi

# Execute tests
if eval $TEST_CMD; then
    print_status "All tests passed!"
    
    if [ "$COVERAGE_ONLY" = true ] || ([ "$FAST_ONLY" = false ] && [ "$LINT_ONLY" = false ]); then
        echo ""
        print_status "Coverage report generated in htmlcov/"
        print_status "Open htmlcov/index.html in your browser to view detailed coverage"
    fi
else
    print_error "Tests failed!"
    exit 1
fi

echo ""
print_status "Test suite completed successfully! 🎉"