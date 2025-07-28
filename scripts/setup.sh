#!/bin/bash
#
# Development Environment Setup Script
# Run this script after cloning the repository to set up your development environment
#

set -e

echo "🚀 Setting up Walk-Up Music Manager development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status "❌ Node.js is not installed. Please install Node.js 18 or higher." "$RED"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_status "❌ Node.js version 18 or higher is required. Current version: $(node --version)" "$RED"
    exit 1
fi

print_status "✅ Node.js $(node --version) detected" "$GREEN"

# Install dependencies
print_status "📦 Installing dependencies..." "$BLUE"
npm install

# Set up git hooks
print_status "🔗 Setting up git hooks..." "$BLUE"
git config core.hooksPath hooks
chmod +x hooks/pre-commit

# Run initial checks to make sure everything works
print_status "🧪 Running initial checks..." "$BLUE"

# Run linting
print_status "Running ESLint..." "$YELLOW"
npm run lint

# Run tests
print_status "Running tests..." "$YELLOW"
npm test -- --watchAll=false

# Check formatting
print_status "Checking code formatting..." "$YELLOW"
npm run format:check

# Build the project
print_status "Building project..." "$YELLOW"
npm run build

print_status "🎉 Setup complete! Your development environment is ready." "$GREEN"
print_status "📝 Available commands:" "$BLUE"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run test:watch   - Run tests in watch mode"
echo "  npm run lint         - Run ESLint"
echo "  npm run format       - Format code with Prettier"
echo "  npm run format:check - Check code formatting"
echo "  npm run deploy       - Deploy to GitHub Pages"
echo ""
print_status "🔒 Git hooks are now active and will run before each commit." "$GREEN"
print_status "💡 If you need to bypass hooks for emergency commits, use: git commit --no-verify" "$YELLOW"