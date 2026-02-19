// Diagnostic version - Shows detailed errors
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const API_KEY = process.env.NEWS_API_KEY;
  
  // Diagnostic: Check if API key exists
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'API key not configured',
      diagnostic: 'NEWS_API_KEY environment variable is not set in Vercel',
      fix: 'Go to Vercel Settings → Environment Variables → Add NEWS_API_KEY'
    });
  }
  
  try {
    // Simple test query
    const testUrl = `https://newsapi.org/v2/everything?q=technology&pageSize=5&language=en&apiKey=${API_KEY}`;
    
    console.log('Testing NewsAPI connection...');
    const response = await fetch(testUrl);
    const data = await response.json();
    
    // Check if NewsAPI returned an error
    if (data.status === 'error') {
      return res.status(500).json({
        error: 'NewsAPI Error',
        diagnostic: data.message,
        code: data.code,
        fix: data.code === 'rateLimited' 
          ? 'You have hit the NewsAPI rate limit. Wait 24 hours or upgrade your plan.'
          : 'Check your NewsAPI key is valid at newsapi.org'
      });
    }
    
    // Success - return diagnostic info
    return res.status(200).json({
      status: 'success',
      message: 'API is working correctly!',
      articlesFound: data.articles?.length || 0,
      apiKeyStatus: 'Valid',
      sampleArticle: data.articles?.[0]?.title || 'No articles',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ 
      error: 'Network or fetch error',
      diagnostic: error.message,
      errorType: error.name,
      fix: 'This might be a network timeout or CORS issue. Check Vercel function logs.'
    });
  }
}
