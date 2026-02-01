#!/bin/bash

# Example MCP Task Execution Scripts
# Demonstrates various ways to use Heady MCP services via curl

API_BASE="${API_BASE:-http://localhost:4100}"
API_KEY="${HC_AUTOMATION_API_KEY:-your_api_key_here}"

echo "🚀 Heady MCP Services - Example Tasks"
echo "======================================"
echo ""

# Example 1: Code Generation with Jules
echo "📝 Example 1: Generate TypeScript Function"
curl -X POST "$API_BASE/api/task/execute" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "type": "code_generation",
    "description": "Create a TypeScript function to validate email addresses using regex",
    "context": {
      "language": "typescript",
      "includeTests": true,
      "framework": "none"
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Example 2: Research with GitHub Copilot
echo "🔍 Example 2: Research Best Practices"
curl -X POST "$API_BASE/api/task/execute" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "type": "research",
    "description": "Find best practices for React component testing with Vitest",
    "context": {
      "framework": "React",
      "testingLibrary": "Vitest"
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Example 3: Design System with Heady MCP
echo "🎨 Example 3: Generate Phi Tokens"
curl -X POST "$API_BASE/api/task/execute" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "type": "design_system",
    "description": "Generate sacred geometry spacing scale using golden ratio",
    "context": {
      "baseUnit": 8,
      "ratio": 1.618,
      "steps": 8,
      "pattern": "fibonacci"
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Example 4: Browser Automation with Playwright
echo "🌐 Example 4: Browser Automation"
curl -X POST "$API_BASE/api/task/execute" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "type": "browser_automation",
    "description": "Navigate to GitHub and extract repository information",
    "context": {
      "url": "https://github.com/HeadySystems",
      "actions": ["navigate", "extract_text"]
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Example 5: Batch Execution
echo "📦 Example 5: Batch Task Execution"
curl -X POST "$API_BASE/api/task/batch" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "tasks": [
      {
        "type": "code_generation",
        "description": "Create a React authentication component"
      },
      {
        "type": "code_generation",
        "description": "Create a user profile component"
      },
      {
        "type": "research",
        "description": "Find security best practices for authentication"
      }
    ]
  }' | jq '.'

echo ""
echo "✅ Examples complete!"
