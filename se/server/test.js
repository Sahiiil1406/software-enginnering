
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testFeedRecommendation() {
  console.log('\n=== TESTING FEED RECOMMENDATION ===\n');
  
  try {
    // Test Random Feed
    console.log('Testing Random Feed...');
    const randomRes = await axios.get(`${BASE_URL}/feed/random/1`);
    console.log(`Random Feed Response Time: ${randomRes.data.responseTime}ms`);
    console.log(`Posts returned: ${randomRes.data.count}`);
    
    // Test ML Feed
    console.log('\nTesting ML Feed...');
    const mlRes = await axios.get(`${BASE_URL}/feed/ml/1`);
    console.log(`ML Feed Response Time: ${mlRes.data.responseTime}ms`);
    console.log(`Posts returned: ${mlRes.data.count}`);
    console.log(`User interests: ${mlRes.data.userInterests.join(', ')}`);
    
    // Compare both
    console.log('\nComparing Both Methods...');
    const compareRes = await axios.get(`${BASE_URL}/feed/compare/1`);
    console.log('\nRandom Feed:');
    console.log(`  Avg Relevance: ${compareRes.data.random.avgRelevance.toFixed(2)}`);
    console.log(`  Interest Matches: ${compareRes.data.random.interestMatches}/10`);
    console.log('\nML Feed:');
    console.log(`  Avg Relevance: ${compareRes.data.ml.avgRelevance.toFixed(2)}`);
    console.log(`  Interest Matches: ${compareRes.data.ml.interestMatches}/10`);
    console.log('\nImprovement:');
    console.log(`  Relevance: +${compareRes.data.improvement.relevanceImprovement}%`);
    console.log(`  Interest Matches: +${compareRes.data.improvement.interestMatchImprovement}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testAutoscaling() {
  console.log('\n=== TESTING AUTOSCALING ===\n');
  
  try {
    // Check initial capacity
    console.log('Checking server capacity...');
    const capacityRes = await axios.get(`${BASE_URL}/autoscale/capacity`);
    console.log(`Current RPS: ${capacityRes.data.requestsPerSecond}`);
    console.log(`Max Capacity: ${capacityRes.data.maxCapacity} req/s`);
    
    // Load test
    console.log('\nRunning load test (100 requests)...');
    const startTime = Date.now();
    const requests = Array(100).fill(null).map(() => 
      axios.get(`${BASE_URL}/autoscale/test-load`)
    );
    await Promise.all(requests);
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Completed 100 requests in ${duration.toFixed(2)}s`);
    console.log(`Actual RPS: ${(100 / duration).toFixed(2)}`);
    
    // Simulate traffic spike
    console.log('\nSimulating traffic spike scenario...');
    const simRes = await axios.post(`${BASE_URL}/autoscale/simulate`, {
      duration: 30,
      baseTraffic: 50,
      peakTraffic: 150
    });
    
    console.log('\nWithout Autoscaling:');
    console.log(`  Avg Response Time: ${simRes.data.statistics.noScaling.avgResponseTime}ms`);
    console.log(`  Total Errors: ${simRes.data.statistics.noScaling.totalErrors}%`);
    console.log(`  Servers: ${simRes.data.statistics.noScaling.maxServers}`);
    
    console.log('\nWith Autoscaling:');
    console.log(`  Avg Response Time: ${simRes.data.statistics.withScaling.avgResponseTime}ms`);
    console.log(`  Total Errors: ${simRes.data.statistics.withScaling.totalErrors}%`);
    console.log(`  Max Servers: ${simRes.data.statistics.withScaling.maxServers}`);
    console.log(`  Avg Servers: ${simRes.data.statistics.withScaling.avgServers}`);
    
    console.log('\nImprovement:');
    console.log(`  Response Time: ${simRes.data.improvement.responseTime}% faster`);
    console.log(`  Error Reduction: ${simRes.data.improvement.errors}%`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runAllTests() {
  await testFeedRecommendation();
  await testAutoscaling();
  console.log('\n=== ALL TESTS COMPLETED ===\n');
}

runAllTests();
