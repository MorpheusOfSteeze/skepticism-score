require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TwitterApi } = require('twitter-api-v2');
const Sentiment = require('sentiment');
const net = require('net');

const app = express();
const sentiment = new Sentiment();
const port = process.env.PORT || 5002;

// Function to check if port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// More permissive CORS settings for development
app.use(cors({
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Constants for API limits
const MAX_TWEETS = 5;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Simple in-memory cache
const cache = new Map();

// Helper function to clean old cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// Clean cache periodically
setInterval(cleanCache, CACHE_DURATION);

// Verify Twitter token is present
if (!process.env.TWITTER_BEARER_TOKEN) {
  console.error('ERROR: TWITTER_BEARER_TOKEN is not set in environment variables');
  process.exit(1);
}

// Initialize Twitter client
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

// Add a basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper function to validate username
const isValidUsername = (username) => {
  return /^[A-Za-z0-9_]{1,15}$/.test(username);
};

// Helper function to calculate misinformation score
const calculateMisinformationScore = (tweets) => {
  if (!tweets || tweets.length === 0) {
    return 5; // Default neutral score if no tweets
  }
  
  let totalScore = 0;
  
  for (const tweet of tweets) {
    const analysis = sentiment.analyze(tweet.text);
    const tweetScore = analysis.score;
    
    // Factors that might indicate misinformation
    const hasExtremeLanguage = tweet.text.match(/\b(must|never|always|everyone|nobody)\b/gi) ? 1 : 0;
    const hasExclamationMarks = (tweet.text.match(/!/g) || []).length > 2 ? 1 : 0;
    const hasCapsLock = tweet.text.match(/[A-Z]{5,}/g) ? 1 : 0;
    
    // Calculate individual tweet score (1-10 scale)
    const tweetMisinfoScore = Math.min(10, Math.max(1, 
      5 + // Base score
      (Math.abs(tweetScore) * 0.5) + // Sentiment extremity
      hasExtremeLanguage * 1.5 +
      hasExclamationMarks * 1 +
      hasCapsLock * 2
    ));
    
    totalScore += tweetMisinfoScore;
  }
  
  // Return average score rounded to nearest integer
  return Math.round(totalScore / tweets.length);
};

app.post('/analyze', async (req, res) => {
  try {
    const { username } = req.body;
    
    // Remove @ symbol if present
    const cleanUsername = username.replace('@', '');
    
    // Validate username format
    if (!isValidUsername(cleanUsername)) {
      return res.status(400).json({ 
        error: 'Invalid username format. Username should only contain letters, numbers, and underscores, and be 1-15 characters long.' 
      });
    }

    // Check cache first
    const cacheKey = `user_${cleanUsername}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      console.log(`Cache hit for user: ${cleanUsername}`);
      return res.json(cachedResult.data);
    }
    
    // Get user's recent tweets
    const user = await twitterClient.v2.userByUsername(cleanUsername);
    
    if (!user.data) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tweets = await twitterClient.v2.userTimeline(user.data.id, {
      max_results: MAX_TWEETS,
      'tweet.fields': 'text,created_at'
    });
    
    const tweetData = tweets.data.data || [];
    const misinformationScore = calculateMisinformationScore(tweetData);
    
    const result = {
      username: cleanUsername,
      score: misinformationScore,
      analyzedTweets: tweetData.length,
      lastAnalyzed: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error.data?.detail || error.message || 'Failed to analyze tweets';
    const statusCode = error.code || 500;
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Updated server start
const startServer = async () => {
  const portInUse = await isPortInUse(port);
  if (portInUse) {
    console.error(`Port ${port} is already in use. Please try a different port.`);
    process.exit(1);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log(`- GET  http://localhost:${port}/health`);
    console.log(`- POST http://localhost:${port}/analyze`);
  });
};

startServer(); 