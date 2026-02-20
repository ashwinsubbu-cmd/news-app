// Enhanced API with user custom keyword support
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const API_KEY = process.env.NEWS_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    // Get user keywords from query parameter
    const userKeywordsParam = req.query.keywords;
    let userKeywords = [];
    
    if (userKeywordsParam) {
      try {
        userKeywords = JSON.parse(userKeywordsParam);
      } catch (e) {
        console.log('Could not parse user keywords');
      }
    }
    
    // Base topics
    const topics = [
      { 
        query: '"breaking news" OR "developing story" OR "just in"', 
        category: 'Breaking News',
        keywords: ['breaking', 'urgent', 'alert', 'just in', 'developing'],
        pageSize: 3
      },
      { 
        query: 'H1B OR "green card" OR USCIS OR "work visa" OR immigration', 
        category: 'Immigration & H1B',
        keywords: ['h1b', 'h-1b', 'visa', 'immigration', 'uscis', 'green card', 'work permit'],
        pageSize: 2
      },
      { 
        query: '"AI sales" OR "sales automation" OR "AI SDR" OR "predictive sales"', 
        category: 'AI in Sales',
        keywords: ['ai sales', 'sales automation', 'ai sdr', 'sales ai', 'predictive sales'],
        pageSize: 2
      },
      { 
        query: '"artificial intelligence" OR "machine learning" OR "deep learning" OR GPT', 
        category: 'Tech & AI',
        keywords: ['artificial intelligence', 'machine learning', 'ai model', 'gpt', 'claude', 'openai'],
        pageSize: 3
      },
      { 
        query: '"IT consulting" OR outsourcing OR "BPO services"', 
        category: 'Outsourcing & Consulting',
        keywords: ['consulting', 'outsourcing', 'bpo', 'offshore'],
        pageSize: 2
      },
      { 
        query: 'Microsoft OR Azure OR "Office 365" OR Windows', 
        category: 'Microsoft & Software',
        keywords: ['microsoft', 'azure', 'windows', 'office', 'copilot'],
        pageSize: 2
      },
      { 
        query: 'semiconductor OR "chip manufacturing" OR TSMC OR Intel OR NVIDIA', 
        category: 'Silicon Chips',
        keywords: ['semiconductor', 'chip', 'tsmc', 'intel', 'nvidia'],
        pageSize: 2
      },
      { 
        query: '"India economy" OR "Indian GDP" OR rupee', 
        category: 'India Economy',
        keywords: ['india economy', 'indian', 'rupee', 'mumbai', 'rbi'],
        pageSize: 2
      },
      { 
        query: 'parenting OR "child development" OR "early education"', 
        category: 'Parenting',
        keywords: ['parenting', 'children', 'kids', 'toddler', 'child development'],
        pageSize: 2
      },
      { 
        query: '"B2B sales" OR "SaaS sales" OR "enterprise sales"', 
        category: 'Tech Sales',
        keywords: ['b2b sales', 'saas', 'enterprise sales', 'sales strategy'],
        pageSize: 2
      },
      { 
        query: '"vedic astrology" OR jyotish OR horoscope', 
        category: 'Vedic Astrology',
        keywords: ['vedic', 'astrology', 'jyotish', 'horoscope'],
        pageSize: 1
      },
      { 
        query: 'meditation OR mindfulness OR yoga OR spirituality', 
        category: 'Art of Living & Meditation',
        keywords: ['meditation', 'mindfulness', 'yoga', 'spiritual'],
        pageSize: 2
      }
    ];
    
    // Add user custom topics
    if (userKeywords.length > 0) {
      userKeywords.forEach(keyword => {
        topics.push({
          query: `"${keyword}" OR ${keyword}`,
          category: keyword, // Use the keyword as the category name
          keywords: [keyword.toLowerCase()],
          pageSize: 2,
          isCustom: true
        });
      });
    }
    
    const allArticles = [];
    
    // Fetch news for all topics
    const fetchPromises = topics.map(async (topic) => {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic.query)}&sortBy=publishedAt&pageSize=${topic.pageSize * 2}&language=en&apiKey=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles) {
          const relevantArticles = data.articles
            .filter(article => isRelevantToCategory(article, topic))
            .slice(0, topic.pageSize)
            .map(article => ({
              ...article,
              category: topic.category,
              isCustomTopic: topic.isCustom || false,
              extendedSummary: generateExtendedSummary(article)
            }));
          
          return relevantArticles;
        }
        return [];
      } catch (error) {
        console.error(`Error fetching ${topic.category}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(fetchPromises);
    results.forEach(articles => allArticles.push(...articles));
    
    // Remove duplicates
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.url, item])).values()
    );
    
    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // Limit to 30 articles
    const finalArticles = uniqueArticles.slice(0, 30);
    
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    
    return res.status(200).json({
      articles: finalArticles,
      totalResults: finalArticles.length,
      fetchedAt: new Date().toISOString(),
      customKeywordsCount: userKeywords.length,
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

function isRelevantToCategory(article, topic) {
  const searchText = `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();
  
  const matchCount = topic.keywords.filter(keyword => 
    searchText.includes(keyword.toLowerCase())
  ).length;
  
  return matchCount > 0;
}

function generateExtendedSummary(article) {
  const description = article.description || '';
  const content = article.content || '';
  const title = article.title || '';
  
  let fullText = `${description} ${content}`.trim();
  fullText = fullText.replace(/\[\+\d+ chars\]/g, '');
  
  const sentences = fullText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  let summary = '';
  let wordCount = 0;
  const targetWords = 200;
  
  summary += `${title}. `;
  wordCount += title.split(' ').length;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(' ').length;
    
    if (wordCount + sentenceWords > targetWords && wordCount > 150) {
      break;
    }
    
    summary += sentence + '. ';
    wordCount += sentenceWords;
  }
  
  if (wordCount < 150 && description) {
    summary += ` Additional context: ${description}`;
  }
  
  const source = article.source?.name;
  const author = article.author;
  const publishedDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : null;
  
  if (source || author) {
    summary += ` This report`;
    if (source) summary += ` from ${source}`;
    if (author) summary += ` by ${author}`;
    if (publishedDate) summary += ` published on ${publishedDate}`;
    summary += ' provides important insights on this developing story.';
  }
  
  summary = summary
    .replace(/\s+/g, ' ')
    .replace(/\.\./g, '.')
    .replace(/\.\s*\./g, '.')
    .trim();
  
  if (!summary.match(/[.!?]$/)) {
    summary += '.';
  }
  
  return summary || description || 'Detailed summary not available for this article.';
}
