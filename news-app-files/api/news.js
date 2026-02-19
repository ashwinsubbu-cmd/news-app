// Vercel Serverless Function - /api/news.js
// This keeps your API key SECRET and secure

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Your NewsAPI key (stored as environment variable in Vercel)
  const API_KEY = process.env.NEWS_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    // Define your topics
    const topics = [
      { query: 'artificial intelligence OR AI', category: 'Tech & AI' },
      { query: 'H1B visa OR immigration', category: 'Immigration & H1B' },
      { query: 'AI sales OR sales automation', category: 'AI in Sales' },
      { query: 'Microsoft OR software', category: 'Tech & AI' }
    ];
    
    // Fetch news for all topics
    const allArticles = [];
    
    for (const topic of topics) {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic.query)}&sortBy=publishedAt&pageSize=3&language=en&apiKey=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.articles) {
        // Add category and simple AI summary
        data.articles.forEach(article => {
          article.category = topic.category;
          // Generate simple summary (first 2 sentences of description or content)
          const text = article.description || article.content || '';
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
          article.summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
        });
        
        allArticles.push(...data.articles);
      }
    }
    
    // Remove duplicates and limit to 10 articles
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.url, item])).values()
    ).slice(0, 10);
    
    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600');
    
    return res.status(200).json({
      articles: uniqueArticles,
      totalResults: uniqueArticles.length,
      fetchedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
}
