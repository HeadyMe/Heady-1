#!/usr/bin/env node

/**
 * Test script for Heady MCP Services Integration
 * 
 * This script demonstrates and tests the MCP service integration
 * by executing various tasks through the Heady Automation IDE API.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:4100';
const API_KEY = process.env.HC_AUTOMATION_API_KEY || 'your_api_key_here';

async function testMCPServices() {
  console.log('🧪 Testing Heady MCP Services Integration\n');

  // Test 1: Health Check
  console.log('📋 Test 1: Health Check');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log('✅ Health check passed');
    console.log('   Available services:', data.mcp.available.join(', '));
    console.log('   Running services:', data.mcp.running.join(', ') || 'none');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }

  console.log('\n');

  // Test 2: List MCP Services
  console.log('📋 Test 2: List MCP Services');
  try {
    const response = await fetch(`${API_BASE}/api/mcp/services`);
    const data = await response.json();
    console.log('✅ Services listed successfully');
    console.log('   Available:', data.available.length);
    console.log('   Running:', data.running.length);
  } catch (error) {
    console.error('❌ Service listing failed:', error.message);
  }

  console.log('\n');

  // Test 3: Execute Code Generation Task (Jules)
  console.log('📋 Test 3: Code Generation Task (Jules)');
  try {
    const task = {
      type: 'code_generation',
      description: 'Create a simple TypeScript function that adds two numbers',
      context: {
        language: 'typescript',
        returnType: 'number'
      }
    };

    const response = await fetch(`${API_BASE}/api/task/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(task)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Code generation task completed');
      console.log(`   Service: ${result.service}`);
      console.log(`   Execution time: ${result.executionTime}ms`);
      console.log('   Result:', JSON.stringify(result.result, null, 2).substring(0, 200) + '...');
    } else {
      console.log('⚠️  Task failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Code generation test failed:', error.message);
  }

  console.log('\n');

  // Test 4: Design System Task (Heady MCP)
  console.log('📋 Test 4: Design System Task (Heady MCP)');
  try {
    const task = {
      type: 'design_system',
      description: 'Generate Phi-based spacing tokens',
      context: {
        baseUnit: 8,
        scale: 'golden_ratio',
        steps: 5
      }
    };

    const response = await fetch(`${API_BASE}/api/task/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(task)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Design system task completed');
      console.log(`   Service: ${result.service}`);
      console.log(`   Execution time: ${result.executionTime}ms`);
    } else {
      console.log('⚠️  Task failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Design system test failed:', error.message);
  }

  console.log('\n');

  // Test 5: Batch Execution
  console.log('📋 Test 5: Batch Task Execution');
  try {
    const tasks = [
      {
        type: 'code_generation',
        description: 'Create a React functional component'
      },
      {
        type: 'research',
        description: 'Find best practices for React hooks'
      }
    ];

    const response = await fetch(`${API_BASE}/api/task/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ tasks })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Batch execution completed');
      console.log(`   Tasks executed: ${result.results.length}`);
      result.results.forEach((r, i) => {
        console.log(`   Task ${i + 1}: ${r.success ? '✅' : '❌'} (${r.executionTime}ms)`);
      });
    } else {
      console.log('⚠️  Batch execution failed');
    }
  } catch (error) {
    console.error('❌ Batch execution test failed:', error.message);
  }

  console.log('\n');
  console.log('🎉 MCP Integration Tests Complete');
}

// Run tests
testMCPServices().catch(console.error);
