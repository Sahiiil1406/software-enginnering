// ============================================
// FULL STACK IMPLEMENTATION - JSON Based
// server.js
// ============================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// LOAD DATA FROM JSON FILES
// ============================================

let posts = [];
let users = [];

function loadData() {
  try {
    const postsPath = path.join(__dirname, 'posts.json');
    const usersPath = path.join(__dirname, 'users.json');
    
    if (!fs.existsSync(postsPath)) {
      console.error('❌ posts.json not found!');
      console.log('💡 Run: node generateData.js first to create data files');
      process.exit(1);
    }
    
    if (!fs.existsSync(usersPath)) {
      console.error('❌ users.json not found!');
      console.log('💡 Run: node generateData.js first to create data files');
      process.exit(1);
    }
    
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    
    console.log(`✅ Loaded ${posts.length} posts from posts.json`);
    console.log(`✅ Loaded ${users.length} users from users.json`);
  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    process.exit(1);
  }
}

// Load data on startup
loadData();

// ============================================
// FEATURE 1: FEED RECOMMENDATION APIs
// ============================================

// Helper function to calculate relevance score
function calculateRelevanceScore(post, user) {
  let score = 0;
  
  // Interest match (40 points)
  if (user.interests.includes(post.genre)) {
    score += 40;
  }
  
  // Category match (30 points)
  if (user.genres.includes(post.category)) {
    score += 30;
  }
  
  // Interaction history (50 points)
  if (user.interactions.includes(post.id)) {
    score += 50;
  }
  
  // Engagement score (20 points max)
  score += (post.engagement / 1000) * 20;
  
  // Recency bonus (10 points max)
  const postDate = new Date(post.createdAt);
  const daysSincePost = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 10 - (daysSincePost / 3));
  
  return score;
}

// Random Feed (Static)
app.get('/api/feed/random/:userId', (req, res) => {
  const startTime = Date.now();
  
  try {
    // Shuffle and get random 10 posts
    const shuffled = [...posts].sort(() => Math.random() - 0.5);
    const randomPosts = shuffled.slice(0, 10);
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      method: 'random',
      posts: randomPosts,
      responseTime,
      count: randomPosts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ML-Based Feed
app.get('/api/feed/ml/:userId', (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // ML Scoring Algorithm
    const scoredPosts = posts.map(post => ({
      ...post,
      relevanceScore: calculateRelevanceScore(post, user)
    }));
    
    // Sort and get top 10
    const topPosts = scoredPosts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      method: 'ml',
      posts: topPosts,
      responseTime,
      count: topPosts.length,
      userInterests: user.interests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare Both Methods
app.get('/api/feed/compare/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get random feed
    const shuffled = [...posts].sort(() => Math.random() - 0.5);
    const randomPosts = shuffled.slice(0, 10);
    
    // Get ML feed
    const scoredPosts = posts.map(post => ({
      ...post,
      relevanceScore: calculateRelevanceScore(post, user)
    }));
    
    const mlPosts = scoredPosts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
    
    // Calculate metrics for random feed
    const randomRelevance = randomPosts.reduce((sum, post) => {
      return sum + calculateRelevanceScore(post, user);
    }, 0) / randomPosts.length;
    
    const mlRelevance = mlPosts.reduce((sum, post) => 
      sum + post.relevanceScore, 0) / mlPosts.length;
    
    const randomInterestMatch = randomPosts.filter(p => 
      user.interests.includes(p.genre)).length;
    const mlInterestMatch = mlPosts.filter(p => 
      user.interests.includes(p.genre)).length;
    
    const randomCategoryMatch = randomPosts.filter(p => 
      user.genres.includes(p.category)).length;
    const mlCategoryMatch = mlPosts.filter(p => 
      user.genres.includes(p.category)).length;
    
    res.json({
      random: {
        posts: randomPosts,
        avgRelevance: randomRelevance.toFixed(2),
        interestMatches: randomInterestMatch,
        categoryMatches: randomCategoryMatch
      },
      ml: {
        posts: mlPosts,
        avgRelevance: mlRelevance.toFixed(2),
        interestMatches: mlInterestMatch,
        categoryMatches: mlCategoryMatch
      },
      improvement: {
        relevanceImprovement: ((mlRelevance - randomRelevance) / randomRelevance * 100).toFixed(2),
        interestMatchImprovement: mlInterestMatch - randomInterestMatch,
        categoryMatchImprovement: mlCategoryMatch - randomCategoryMatch
      },
      userProfile: {
        name: user.name,
        interests: user.interests,
        genres: user.genres,
        totalInteractions: user.interactions.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      interests: u.interests,
      genres: u.genres
    })),
    count: users.length
  });
});

// Get user by ID
app.get('/api/users/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
});

// ============================================
// FEATURE 2: AUTOSCALING APIs
// ============================================

// let serverMetrics = {
//   requests: 0,
//   startTime: Date.now(),
//   activeRequests: 0,
//   requestHistory: []
// };

// // Middleware to track requests
// app.use((req, res, next) => {
//   serverMetrics.requests++;
//   serverMetrics.activeRequests++;
  
//   const requestStart = Date.now();
  
//   res.on('finish', () => {
//     serverMetrics.activeRequests--;
//     const duration = Date.now() - requestStart;
//     serverMetrics.requestHistory.push({
//       timestamp: Date.now(),
//       duration,
//       path: req.path
//     });
    
//     // Keep only last 100 requests
//     if (serverMetrics.requestHistory.length > 100) {
//       serverMetrics.requestHistory.shift();
//     }
//   });
  
//   next();
// });

// // Get server capacity
// // app.get('/api/autoscale/capacity', (req, res) => {
// //   const uptime = (Date.now() - serverMetrics.startTime) / 1000;
// //   const rps = serverMetrics.requests / uptime;
  
// //   const avgResponseTime = serverMetrics.requestHistory.length > 0
// //     ? serverMetrics.requestHistory.reduce((sum, r) => sum + r.duration, 0) / serverMetrics.requestHistory.length
// //     : 0;
  
// //   res.json({
// //     totalRequests: serverMetrics.requests,
// //     uptimeSeconds: uptime.toFixed(2),
// //     requestsPerSecond: rps.toFixed(2),
// //     activeRequests: serverMetrics.activeRequests,
// //     avgResponseTime: avgResponseTime.toFixed(2),
// //     maxCapacity: 100 // baseline capacity in req/s
// //   });
// // });

// // Load test endpoint
// app.get('/api/autoscale/test-load', async (req, res) => {
//   // Simulate some processing
//   const delay = Math.random() * 50 + 10;
//   await new Promise(resolve => setTimeout(resolve, delay));
  
//   res.json({ 
//     processed: true, 
//     delay: delay.toFixed(2),
//     timestamp: Date.now()
//   });
// });

// // Benchmark - measure actual server capacity
// app.get('/api/autoscale/benchmark', async (req, res) => {
//   const testDuration = 5; // seconds
//   const startTime = Date.now();
//   let requestCount = 0;
  
//   console.log('\n🔍 Running capacity benchmark...');
  
//   const interval = setInterval(() => {
//     requestCount++;
//   }, 10); // Simulate request every 10ms
  
//   setTimeout(() => {
//     clearInterval(interval);
//     const elapsed = (Date.now() - startTime) / 1000;
//     const capacity = requestCount / elapsed;
    
//     console.log(`✅ Benchmark complete: ~${capacity.toFixed(0)} req/s capacity`);
    
//     res.json({
//       duration: testDuration,
//       requestCount,
//       capacity: capacity.toFixed(2),
//       timestamp: Date.now()
//     });
//   }, testDuration * 1000);
// });

// // Simulate traffic spike and measure
// app.post('/api/autoscale/simulate', async (req, res) => {
//   const { duration = 30, baseTraffic = 50, peakTraffic = 150 } = req.body;
  
//   console.log('\n🚀 Running autoscaling simulation...');
//   console.log(`   Duration: ${duration} time units`);
//   console.log(`   Base Traffic: ${baseTraffic} req/s`);
//   console.log(`   Peak Traffic: ${peakTraffic} req/s\n`);
  
//   const results = {
//     noScaling: [],
//     withScaling: []
//   };
  
//   for (let t = 0; t < duration; t++) {
//     let traffic = baseTraffic + Math.random() * 20;
    
//     // Peak period (time 15-25)
//     if (t >= 15 && t <= 25) {
//       traffic = peakTraffic + Math.random() * 30;
//     }
    
//     // No scaling scenario
//     const noScaleUtil = (traffic / 100) * 100;
//     const noScaleResponse = noScaleUtil > 80 
//       ? 100 + (noScaleUtil - 80) * 20 
//       : 50 + noScaleUtil * 0.5;
//     const noScaleErrors = noScaleUtil > 90 ? (noScaleUtil - 90) * 2 : 0;
    
//     results.noScaling.push({
//       time: t,
//       traffic: Math.round(traffic),
//       utilization: Math.min(noScaleUtil, 100).toFixed(2),
//       responseTime: Math.round(noScaleResponse),
//       errorRate: noScaleErrors.toFixed(2),
//       servers: 1,
//       capacity: 100
//     });
    
//     // With scaling scenario
//     let servers = 1;
//     const utilizationThreshold = 70; // Scale when utilization > 70%
    
//     if (t >= 15 && t <= 25) {
//       const predictedUtil = (traffic / 100) * 100;
//       if (predictedUtil > utilizationThreshold) {
//         servers = Math.ceil(traffic / utilizationThreshold);
//       }
//     }
    
//     const scaledCapacity = 100 * servers;
//     const scaleUtil = (traffic / scaledCapacity) * 100;
//     const scaleResponse = scaleUtil > 80 
//       ? 100 + (scaleUtil - 80) * 20 
//       : 50 + scaleUtil * 0.5;
//     const scaleErrors = scaleUtil > 90 ? (scaleUtil - 90) * 2 : 0;
    
//     results.withScaling.push({
//       time: t,
//       traffic: Math.round(traffic),
//       utilization: Math.min(scaleUtil, 100).toFixed(2),
//       responseTime: Math.round(scaleResponse),
//       errorRate: scaleErrors.toFixed(2),
//       servers,
//       capacity: scaledCapacity
//     });
//   }
  
//   // Calculate statistics
//   const noScaleAvgResponse = results.noScaling.reduce((s, d) => 
//     s + d.responseTime, 0) / duration;
//   const withScaleAvgResponse = results.withScaling.reduce((s, d) => 
//     s + d.responseTime, 0) / duration;
//   const noScaleTotalErrors = results.noScaling.reduce((s, d) => 
//     s + parseFloat(d.errorRate), 0);
//   const withScaleTotalErrors = results.withScaling.reduce((s, d) => 
//     s + parseFloat(d.errorRate), 0);
//   const maxUtil = Math.max(...results.noScaling.map(r => 
//     parseFloat(r.utilization)));
//   const maxUtilWithScale = Math.max(...results.withScaling.map(r => 
//     parseFloat(r.utilization)));
  
//   const stats = {
//     noScaling: {
//       avgResponseTime: noScaleAvgResponse.toFixed(2),
//       maxResponseTime: Math.max(...results.noScaling.map(r => r.responseTime)),
//       totalErrors: noScaleTotalErrors.toFixed(2),
//       maxUtilization: maxUtil.toFixed(2),
//       maxServers: 1,
//       totalServerTime: duration
//     },
//     withScaling: {
//       avgResponseTime: withScaleAvgResponse.toFixed(2),
//       maxResponseTime: Math.max(...results.withScaling.map(r => r.responseTime)),
//       totalErrors: withScaleTotalErrors.toFixed(2),
//       maxUtilization: maxUtilWithScale.toFixed(2),
//       maxServers: Math.max(...results.withScaling.map(r => r.servers)),
//       avgServers: (results.withScaling.reduce((s, r) => 
//         s + r.servers, 0) / duration).toFixed(2),
//       totalServerTime: results.withScaling.reduce((s, r) => s + r.servers, 0)
//     },
//     improvement: {
//       responseTime: ((noScaleAvgResponse - withScaleAvgResponse) / 
//         noScaleAvgResponse * 100).toFixed(2),
//       errors: noScaleTotalErrors > 0 
//         ? ((noScaleTotalErrors - withScaleTotalErrors) / noScaleTotalErrors * 100).toFixed(2)
//         : '100.00',
//       utilization: ((maxUtil - maxUtilWithScale) / maxUtil * 100).toFixed(2)
//     }
//   };
  
//   console.log('✅ Simulation complete!');
//   console.log(`   Response Time Improvement: ${stats.improvement.responseTime}%`);
//   console.log(`   Error Reduction: ${stats.improvement.errors}%\n`);
  
//   res.json({
//     results,
//     statistics: stats,
//     config: { duration, baseTraffic, peakTraffic }
//   });
// });

// ============================================
// UTILITY ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    postsLoaded: posts.length,
    usersLoaded: users.length
  });
});

// Reload data from files
app.post('/api/reload', (req, res) => {
  try {
    loadData();
    res.json({
      success: true,
      message: 'Data reloaded successfully',
      posts: posts.length,
      users: users.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Data loaded: ${posts.length} posts, ${users.length} users`);
  console.log('\n📍 Available Endpoints:');
  console.log('\n   Feed Recommendation:');
  console.log(`   GET  /api/feed/random/:userId`);
  console.log(`   GET  /api/feed/ml/:userId`);
  console.log(`   GET  /api/feed/compare/:userId`);
  console.log(`   GET  /api/users`);
  console.log(`   GET  /api/users/:userId`);
  // console.log('\n   Autoscaling:');
  // console.log(`   GET  /api/autoscale/capacity`);
  // console.log(`   GET  /api/autoscale/test-load`);
  // console.log(`   GET  /api/autoscale/benchmark`);
  // console.log(`   POST /api/autoscale/simulate`);
  // console.log('\n   Utility:');
  // console.log(`   GET  /api/health`);
  // console.log(`   POST /api/reload`);
  console.log('\n' + '='.repeat(50) + '\n');
});