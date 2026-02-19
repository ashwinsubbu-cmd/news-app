// Vercel Serverless Function - /api/news.js
// Enhanced version with all 12 topics and extended summaries

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const API_KEY = process.env.NEWS_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    // All 12 topics with specific search queries
    const topics = [
      { 
        query: 'breaking news OR trending', 
        category: 'Breaking News',
        pageSize: 3
      },
      { 
        query: 'H1B visa OR immigration OR green card OR USCIS', 
        category: 'Immigration & H1B',
        pageSize: 2
      },
      { 
        query: 'AI sales OR sales automation OR AI SDR', 
        category: 'AI in Sales',
        pageSize: 2
      },
      { 
        query: 'artificial intelligence OR machine learning OR AI technology', 
        category: 'Tech & AI',
        pageSize: 3
      },
      { 
        query: 'IT consulting OR outsourcing OR BPO OR offshore', 
        category: 'Outsourcing & Consulting',
        pageSize: 2
      },
      { 
        query: 'Microsoft OR Azure OR Office 365 OR Windows', 
        category: 'Microsoft & Software',
        pageSize: 2
      },
      { 
        query: 'semiconductor OR chip OR TSMC OR Intel OR NVIDIA', 
        category: 'Silicon Chips',
        pageSize: 2
      },
      { 
        query: 'India economy OR Indian market OR rupee OR Indian business', 
        category: 'India Economy',
        pageSize: 2
      },
      { 
        query: 'parenting OR child development OR early education', 
        category: 'Parenting',
        pageSize: 2
      },
      { 
        query: 'B2B sales OR SaaS sales OR enterprise sales', 
        category: 'Tech Sales',
        pageSize: 2
      },
      { 
        query: 'vedic astrology OR jyotish OR horoscope', 
        category: 'Vedic Astrology',
        pageSize: 1
      },
      { 
        query: 'meditation OR mindfulness OR yoga OR spirituality', 
        category: 'Art of Living & Meditation',
        pageSize: 2
      }
    ];
    
    const allArticles = [];
    
    // Fetch news for all topics in parallel
    const fetchPromises = topics.map(async (topic) => {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic.query)}&sortBy=publishedAt&pageSize=${topic.pageSize}&language=en&apiKey=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles) {
          return data.articles.map(article => ({
            ...article,
            category: topic.category,
            extendedSummary: generateExtendedSummary(article)
          }));
        }
        return [];
      } catch (error) {
        console.error(`Error fetching ${topic.category}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(fetchPromises);
    results.forEach(articles => allArticles.push(...articles));
    
    // Remove duplicates based on URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.url, item])).values()
    );
    
    // Sort by published date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // Limit to top 30 articles
    const finalArticles = uniqueArticles.slice(0, 30);
    
    // Cache for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    
    return res.status(200).json({
      articles: finalArticles,
      totalResults: finalArticles.length,
      fetchedAt: new Date().toISOString(),
      topics: topics.map(t => t.category)
    });
    
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
}

// Generate extended 90-120 second read summary
function generateExtendedSummary(article) {
  // Extract text from description and content
  const description = article.description || '';
  const content = article.content || '';
  const title = article.title || '';
  
  // Combine and clean text
  let fullText = `${description} ${content}`.trim();
  
  // Remove [+X chars] patterns from content
  fullText = fullText.replace(/\[\+\d+ chars\]/g, '');
  
  // Split into sentences
  const sentences = fullText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30); // Only meaningful sentences
  
  // Target: 180-240 words for 90-120 second read (reading speed ~120 words/min)
  let summary = '';
  let wordCount = 0;
  const targetWords = 200; // Sweet spot for 90-120 seconds
  
  // Add title context first
  summary += `${title}. `;
  wordCount += title.split(' ').length;
  
  // Add sentences until we reach target word count
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(' ').length;
    
    if (wordCount + sentenceWords > targetWords && wordCount > 150) {
      // We have enough, stop here
      break;
    }
    
    summary += sentence + '. ';
    wordCount += sentenceWords;
  }
  
  // If summary is too short, add more context
  if (wordCount < 150 && description) {
    summary += ` ${description}`;
  }
  
  // Clean up
  summary = summary
    .replace(/\s+/g, ' ') // Remove extra spaces
    .replace(/\.\./g, '.') // Remove double periods
    .trim();
  
  // Ensure it ends properly
  if (!summary.match(/[.!?]$/)) {
    summary += '.';
  }
  
  return summary || description || 'Summary not available.';
}
