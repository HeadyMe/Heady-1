import { Concept, ComplianceReport } from '../src/types';

const WORKER_URL = 'http://localhost:8787';

async function runTests() {
  console.log(`🧪 Running Governance Integration Tests against ${WORKER_URL}...\n`);

  // Test 1: Submit a Concept
  console.log('Test 1: Submit Concept Evaluation');
  const concept: Concept = {
    id: `concept_test_${Date.now()}`,
    name: 'Test Optimization Algorithm',
    description: 'A new way to sort tasks based on quantum flux.',
    tags: ['algorithm', 'optimization'],
    status: 'proposed',
    successMetrics: {
      performance: 95,
      reliability: 80,
      adoption: 10,
      score: 0
    },
    implementationDetails: 'while(true) { optimize() }',
    source: 'internal',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    const res = await fetch(`${WORKER_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(concept)
    });
    const decision = await res.json();
    console.log('  Result:', JSON.stringify(decision, null, 2));
    if (res.ok) console.log('  ✅ Passed');
    else console.log('  ❌ Failed');
  } catch (e) {
    console.log('  ❌ Error:', e);
  }

  // Test 2: Submit Compliance Report
  console.log('\nTest 2: Submit Compliance Report');
  const report: ComplianceReport = {
    systemId: 'node_alpha_1',
    timestamp: Date.now(),
    standardsVersion: '1.0.0',
    overallScore: 98,
    results: [
      {
        standardId: 'std_security_auth',
        compliant: true,
        issues: [],
        score: 100
      }
    ]
  };

  try {
    const res = await fetch(`${WORKER_URL}/protocol/compliance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Actor-ID': 'test_runner' 
      },
      body: JSON.stringify(report)
    });
    const result = await res.json();
    console.log('  Response:', result);
    if (res.ok) console.log('  ✅ Passed');
    else console.log('  ❌ Failed');
  } catch (e) {
    console.log('  ❌ Error:', e);
  }

  // Test 3: Verify Audit Chain
  console.log('\nTest 3: Verify Audit Chain Integrity');
  try {
    const res = await fetch(`${WORKER_URL}/protocol/verify`);
    const verification = await res.json();
    console.log('  Verification:', verification);
    if ((verification as any).valid) console.log('  ✅ Chain Valid');
    else console.log('  ❌ Chain Broken');
  } catch (e) {
    console.log('  ❌ Error:', e);
  }

  // Test 4: Trigger Deep Scan
  console.log('\nTest 4: Trigger Deep Scan');
  try {
    const res = await fetch(`${WORKER_URL}/trigger-scan/${concept.id}`, {
        method: 'POST'
    });
    const scanRes = await res.json();
    console.log('  Scan Result:', scanRes);
    if (res.ok) console.log('  ✅ Passed');
    else console.log('  ❌ Failed');
  } catch (e) {
    console.log('  ❌ Error:', e);
  }
}

runTests();
