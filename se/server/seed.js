// ============================================
// DATA GENERATOR USING FAKER.JS
// File: generateData.js
// ============================================

const { faker } = require('@faker-js/faker');
const fs = require('fs');

// Configuration
const NUM_POSTS = 100;
const NUM_USERS = 20;

// Available options for posts
const GENRES = ['tech', 'sports', 'entertainment', 'news', 'science', 'gaming', 'food', 'travel', 'fashion', 'health'];
const CATEGORIES = ['tutorial', 'news', 'review', 'opinion', 'guide', 'interview', 'analysis', 'howto'];

// Generate realistic post titles based on genre
function generatePostTitle(genre) {
  const titleTemplates = {
    tech: [
      () => `${faker.hacker.verb()} ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
      () => `Introduction to ${faker.hacker.ingverb()}`,
      () => `${faker.company.buzzNoun()} in Modern ${faker.hacker.noun()}`,
      () => `How to ${faker.hacker.verb()} ${faker.hacker.adjective()} Applications`,
    ],
    sports: [
      () => `${faker.person.lastName()} Scores ${faker.number.int({ min: 1, max: 50 })} Points in Victory`,
      () => `${faker.location.city()} vs ${faker.location.city()}: Game Highlights`,
      () => `Breaking: ${faker.person.fullName()} Signs Major Deal`,
      () => `${faker.word.adjective()} Performance in Championship Game`,
    ],
    entertainment: [
      () => `Review: ${faker.music.songName()} Album`,
      () => `${faker.person.firstName()}'s Latest Movie Breaks Box Office Records`,
      () => `Top ${faker.number.int({ min: 5, max: 20 })} ${faker.music.genre()} Songs This Week`,
      () => `Interview with ${faker.person.fullName()}`,
    ],
    news: [
      () => `${faker.location.city()} Announces New ${faker.company.buzzNoun()} Initiative`,
      () => `Breaking: ${faker.company.catchPhrase()}`,
      () => `${faker.location.country()} Leaders Meet for ${faker.word.noun()} Summit`,
      () => `Market Analysis: ${faker.finance.currencyName()} Shows ${faker.word.adjective()} Trends`,
    ],
    science: [
      () => `Scientists Discover ${faker.word.adjective()} ${faker.science.chemicalElement().name} Properties`,
      () => `New Research on ${faker.word.noun()} Published`,
      () => `${faker.word.adjective()} Breakthrough in ${faker.science.unit().name} Technology`,
      () => `Study Reveals ${faker.word.adjective()} Findings About ${faker.word.noun()}`,
    ],
    gaming: [
      () => `${faker.company.name()} Releases New ${faker.word.adjective()} Game`,
      () => `Top ${faker.number.int({ min: 5, max: 15 })} Tips for ${faker.word.noun()} Masters`,
      () => `${faker.person.lastName()} Wins ${faker.location.city()} Gaming Championship`,
      () => `Game Review: ${faker.word.adjective()} ${faker.word.noun()} Edition`,
    ],
    food: [
      () => `${faker.number.int({ min: 5, max: 15 })} ${faker.word.adjective()} Recipes for ${faker.word.noun()}`,
      () => `${faker.location.city()}'s Best ${faker.word.adjective()} Restaurants`,
      () => `How to Make ${faker.word.adjective()} ${faker.word.noun()}`,
      () => `Chef ${faker.person.lastName()} Shares ${faker.word.adjective()} Cooking Tips`,
    ],
    travel: [
      () => `${faker.number.int({ min: 5, max: 20 })} Hidden Gems in ${faker.location.city()}`,
      () => `Travel Guide: Exploring ${faker.location.country()}`,
      () => `${faker.word.adjective()} Adventures in ${faker.location.city()}`,
      () => `Best Time to Visit ${faker.location.country()}: Complete Guide`,
    ],
    fashion: [
      () => `${faker.word.adjective()} Fashion Trends for ${faker.date.month()}`,
      () => `${faker.person.lastName()} Collection: ${faker.word.adjective()} Meets ${faker.word.adjective()}`,
      () => `How to Style ${faker.word.adjective()} ${faker.word.noun()}`,
      () => `${faker.location.city()} Fashion Week: Top ${faker.number.int({ min: 5, max: 15 })} Looks`,
    ],
    health: [
      () => `${faker.number.int({ min: 5, max: 15 })} ${faker.word.adjective()} Health Tips`,
      () => `Understanding ${faker.word.adjective()} ${faker.word.noun()} for Better Wellness`,
      () => `Study: ${faker.word.adjective()} Benefits of ${faker.word.noun()}`,
      () => `How to Improve Your ${faker.word.adjective()} Health`,
    ],
  };

  const templates = titleTemplates[genre];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template();
}

// Generate Posts
function generatePosts(count) {
  const posts = [];
  
  for (let i = 1; i <= count; i++) {
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    
    const post = {
      id: i,
      title: generatePostTitle(genre),
      genre: genre,
      category: category,
      content: faker.lorem.paragraphs(3),
      author: faker.person.fullName(),
      engagement: faker.number.int({ min: 100, max: 1000 }),
      likes: faker.number.int({ min: 50, max: 500 }),
      comments: faker.number.int({ min: 5, max: 100 }),
      shares: faker.number.int({ min: 0, max: 200 }),
      views: faker.number.int({ min: 500, max: 5000 }),
      tags: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.word.noun()),
      thumbnail: faker.image.url(),
      createdAt: faker.date.between({ 
        from: '2024-10-01T00:00:00.000Z', 
        to: '2024-11-22T00:00:00.000Z' 
      }).toISOString(),
      updatedAt: faker.date.recent({ days: 7 }).toISOString()
    };
    
    posts.push(post);
  }
  
  return posts;
}

// Generate Users
function generateUsers(count, posts) {
  const users = [];
  const postIds = posts.map(p => p.id);
  
  for (let i = 1; i <= count; i++) {
    // Random interests (2-4 genres)
    const numInterests = faker.number.int({ min: 2, max: 4 });
    const interests = faker.helpers.arrayElements(GENRES, numInterests);
    
    // Random category preferences (2-3 categories)
    const numGenres = faker.number.int({ min: 2, max: 3 });
    const genres = faker.helpers.arrayElements(CATEGORIES, numGenres);
    
    // Random post interactions (5-20 posts)
    const numInteractions = faker.number.int({ min: 5, max: 20 });
    const interactions = faker.helpers.arrayElements(postIds, numInteractions);
    
    const user = {
      id: i,
      name: faker.person.fullName(),
      username: faker.internet.username().toLowerCase(),
      email: faker.internet.email().toLowerCase(),
      avatar: faker.image.avatar(),
      bio: faker.person.bio(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      interests: interests,
      genres: genres,
      interactions: interactions,
      joinedDate: faker.date.past({ years: 2 }).toISOString(),
      settings: {
        notifications: faker.datatype.boolean(),
        emailUpdates: faker.datatype.boolean(),
        privateProfile: faker.datatype.boolean()
      },
      stats: {
        postsRead: faker.number.int({ min: 50, max: 500 }),
        timeSpent: faker.number.int({ min: 3600, max: 86400 }), // in seconds
        favoriteGenre: faker.helpers.arrayElement(interests)
      }
    };
    
    users.push(user);
  }
  
  return users;
}

// Write to JSON files
function writeToFile(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Successfully generated ${filename}`);
    console.log(`   - Total records: ${data.length}`);
    console.log(`   - File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error.message);
  }
}

// Generate summary statistics
function generateSummary(posts, users) {
  const genreDistribution = {};
  const categoryDistribution = {};
  
  posts.forEach(post => {
    genreDistribution[post.genre] = (genreDistribution[post.genre] || 0) + 1;
    categoryDistribution[post.category] = (categoryDistribution[post.category] || 0) + 1;
  });
  
  const interestDistribution = {};
  users.forEach(user => {
    user.interests.forEach(interest => {
      interestDistribution[interest] = (interestDistribution[interest] || 0) + 1;
    });
  });
  
  const avgInteractions = users.reduce((sum, u) => sum + u.interactions.length, 0) / users.length;
  const totalEngagement = posts.reduce((sum, p) => sum + p.engagement, 0);
  const avgEngagement = totalEngagement / posts.length;
  
  return {
    posts: {
      total: posts.length,
      genreDistribution,
      categoryDistribution,
      totalEngagement,
      avgEngagement: avgEngagement.toFixed(2)
    },
    users: {
      total: users.length,
      avgInteractions: avgInteractions.toFixed(2),
      interestDistribution
    }
  };
}

// Main execution
function main() {
  console.log('🚀 Starting data generation...\n');
  
  console.log(`📝 Generating ${NUM_POSTS} posts...`);
  const posts = generatePosts(NUM_POSTS);
  
  console.log(`👥 Generating ${NUM_USERS} users...`);
  const users = generateUsers(NUM_USERS, posts);
  
  console.log('\n💾 Writing to files...');
  writeToFile('posts.json', posts);
  writeToFile('users.json', users);
  
  console.log('\n📊 Generating summary...');
  const summary = generateSummary(posts, users);
  writeToFile('data-summary.json', summary);
  
  console.log('\n' + '='.repeat(50));
  console.log('📈 DATA GENERATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`\n📝 Posts:`);
  console.log(`   Total: ${summary.posts.total}`);
  console.log(`   Average Engagement: ${summary.posts.avgEngagement}`);
  console.log(`   Genres: ${Object.keys(summary.posts.genreDistribution).join(', ')}`);
  console.log(`   Categories: ${Object.keys(summary.posts.categoryDistribution).join(', ')}`);
  
  console.log(`\n👥 Users:`);
  console.log(`   Total: ${summary.users.total}`);
  console.log(`   Average Interactions per User: ${summary.users.avgInteractions}`);
  console.log(`   Most Popular Interests: ${Object.entries(summary.users.interestDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([interest, count]) => `${interest} (${count})`)
    .join(', ')}`);
  
  console.log('\n✨ Data generation completed successfully!\n');
  console.log('Files created:');
  console.log('  - posts.json');
  console.log('  - users.json');
  console.log('  - data-summary.json');
  console.log('\n📖 You can now use these files to seed your database.');
}

// Run the generator
main();

