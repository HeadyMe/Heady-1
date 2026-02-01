#!/usr/bin/env node

/**
 * Test script for Heady Automation IDE API
 * Tests browser automation with API key authentication
 */

const https = require('https');
const http = require('http');

const API_KEY = process.env.HC_AUTOMATION_API_KEY || 'hc_auto_b3K9mNxP2vQ8rT5yL6wZ1aF4dG7jH0sE';
let BASE_URL = process.env.HC_AUTOMATION_BASE_URL || 'http://localhost:3000';

async function resolveBaseUrl() {
  const candidates = [
    process.env.HC_AUTOMATION_BASE_URL,
    'http://localhost:3000',
    'http://localhost:4100',
  ].filter(Boolean);

  for (const baseUrl of candidates) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return baseUrl;
    } catch {
      // ignore
    }
  }

  return candidates[0] || 'http://localhost:3000';
}

console.log('🧪 Testing Heady Automation IDE API');
console.log('=====================================\n');

// Test 1: Health Check (no auth required)
async function testHealthCheck() {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log(`   ✅ Health Check: ${data.status} - ${data.service}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Health Check Failed: ${error.message}`);
    return false;
  }
}

// Test 2: Screenshot without API key (should fail)
async function testNoAuth() {
  console.log('\n2. Testing Screenshot without API Key (should fail)...');
  try {
    const response = await fetch(`${BASE_URL}/api/task/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        interactive: false
      })
    });
    
    if (response.status === 401) {
      console.log(`   ✅ Correctly rejected: ${response.status} Unauthorized`);
      return true;
    } else {
      console.log(`   ❌ Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return false;
  }
}

// Test 3: Screenshot with API key (should succeed)
async function testWithAuth() {
  console.log('\n3. Testing Screenshot with API Key...');
  try {
    const response = await fetch(`${BASE_URL}/api/task/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        url: 'https://example.com',
        interactive: false
      })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.success && data.screenshot) {
        console.log(`   ✅ Screenshot captured successfully`);
        console.log(`   Screenshot size: ${data.screenshot.length} chars (base64)`);
        return true;
      }
    }
    console.log(`   ❌ Unexpected response: ${response.status}`);
    return false;
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return false;
  }
}

// Test 4: Interactive mode test
async function testInteractiveMode() {
  console.log('\n4. Testing Interactive Mode...');
  try {
    const response = await fetch(`${BASE_URL}/api/task/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        url: 'https://github.com/HeadySystems',
        interactive: true
      })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.success) {
        console.log(`   ✅ Interactive mode screenshot captured`);
        return true;
      }
    }
    console.log(`   ❌ Interactive mode failed: ${response.status}`);
    return false;
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  BASE_URL = await resolveBaseUrl();
  console.log(`Using base URL: ${BASE_URL}`);

  const results = [];
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push(await testHealthCheck());
  results.push(await testNoAuth());
  results.push(await testWithAuth());
  // Skip interactive for automated testing
  // results.push(await testInteractiveMode());
  
  console.log('\n=====================================');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Handle missing fetch in older Node versions
if (typeof fetch === 'undefined') {
  console.log('⚠️  Node.js version too old. Requires Node 18+ with native fetch');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
