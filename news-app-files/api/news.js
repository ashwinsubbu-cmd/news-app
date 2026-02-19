// Vercel Serverless Function - /api/news.js
// Enhanced with accurate category matching

export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);

const API_KEY = process.env.NEWS_API_KEY;

if (!API_KEY) {
return res.status(500).json({ error: ‘API key not configured’ });
}

try {
// More specific queries and filtering for accurate categorization
const topics = [
{
query: ‘“breaking news” OR “developing story” OR “just in”’,
category: ‘Breaking News’,
keywords: [‘breaking’, ‘urgent’, ‘alert’, ‘just in’, ‘developing’],
pageSize: 3
},
{
query: ‘H1B OR “green card” OR USCIS OR “work visa” OR immigration’,
category: ‘Immigration & H1B’,
keywords: [‘h1b’, ‘h-1b’, ‘visa’, ‘immigration’, ‘uscis’, ‘green card’, ‘work permit’],
pageSize: 2
},
{
query: ‘“AI sales” OR “sales automation” OR “AI SDR” OR “predictive sales”’,
category: ‘AI in Sales’,
keywords: [‘ai sales’, ‘sales automation’, ‘ai sdr’, ‘sales ai’, ‘predictive sales’],
pageSize: 2
},
{
query: ‘“artificial intelligence” OR “machine learning” OR “deep learning” OR GPT OR Claude’,
category: ‘Tech & AI’,
keywords: [‘artificial intelligence’, ‘machine learning’, ‘ai model’, ‘gpt’, ‘claude’, ‘openai’, ‘deepmind’],
pageSize: 3
},
{
query: ‘“IT consulting” OR outsourcing OR “BPO services” OR “offshore development”’,
category: ‘Outsourcing & Consulting’,
keywords: [‘consulting’, ‘outsourcing’, ‘bpo’, ‘offshore’, ‘accenture’, ‘deloitte’],
pageSize: 2
},
{
query: ‘Microsoft OR Azure OR “Office 365” OR Windows OR Copilot’,
category: ‘Microsoft & Software’,
keywords: [‘microsoft’, ‘azure’, ‘windows’, ‘office’, ‘copilot’, ‘satya nadella’],
pageSize: 2
},
{
query: ‘semiconductor OR “chip manufacturing” OR TSMC OR Intel OR NVIDIA OR AMD’,
category: ‘Silicon Chips’,
keywords: [‘semiconductor’, ‘chip’, ‘tsmc’, ‘intel’, ‘nvidia’, ‘fabrication’, ‘wafer’],
pageSize: 2
},
{
query: ‘“India economy” OR “Indian GDP” OR “rupee” OR “Reserve Bank of India”’,
category: ‘India Economy’,
keywords: [‘india economy’, ‘indian’, ‘rupee’, ‘mumbai’, ‘delhi’, ‘rbi’, ‘modi’],
pageSize: 2
},
{
query: ‘parenting OR “child development” OR “early education” OR “first grade”’,
category: ‘Parenting’,
keywords: [‘parenting’, ‘children’, ‘kids’, ‘toddler’, ‘child development’, ‘kindergarten’, ‘first grade’],
pageSize: 2
},
{
query: ‘“B2B sales” OR “SaaS sales” OR “enterprise sales” OR “sales strategy”’,
category: ‘Tech Sales’,
keywords: [‘b2b sales’, ‘saas’, ‘enterprise sales’, ‘sales strategy’, ‘quota’, ‘pipeline’],
pageSize: 2
},
{
query: ‘“vedic astrology” OR jyotish OR horoscope OR “birth chart”’,
category: ‘Vedic Astrology’,
keywords: [‘vedic’, ‘astrology’, ‘jyotish’, ‘horoscope’, ‘zodiac’, ‘planetary’],
pageSize: 1
},
{
query: ‘meditation OR mindfulness OR yoga OR “art of living” OR spirituality’,
category: ‘Art of Living & Meditation’,
keywords: [‘meditation’, ‘mindfulness’, ‘yoga’, ‘spiritual’, ‘breathing’, ‘pranayama’],
pageSize: 2
}
];

```
const allArticles = [];

// Fetch news for all topics
const fetchPromises = topics.map(async (topic) => {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic.query)}&sortBy=publishedAt&pageSize=${topic.pageSize * 2}&language=en&apiKey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.articles) {
      // Filter articles to ensure they match the category
      const relevantArticles = data.articles
        .filter(article => isRelevantToCategory(article, topic))
        .slice(0, topic.pageSize)
        .map(article => ({
          ...article,
          category: topic.category,
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
```

} catch (error) {
console.error(‘Error fetching news:’, error);
return res.status(500).json({
error: ‘Failed to fetch news’,
message: error.message
});
}
}

// Check if article is actually relevant to the category
function isRelevantToCategory(article, topic) {
const searchText = `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();

// Must match at least one keyword from the category
const matchCount = topic.keywords.filter(keyword =>
searchText.includes(keyword.toLowerCase())
).length;

// Require at least one keyword match for relevance
return matchCount > 0;
}

// Generate extended 90-120 second read summary
function generateExtendedSummary(article) {
const description = article.description || ‘’;
const content = article.content || ‘’;
const title = article.title || ‘’;

let fullText = `${description} ${content}`.trim();
fullText = fullText.replace(/[+\d+ chars]/g, ‘’);

const sentences = fullText
.split(/[.!?]+/)
.map(s => s.trim())
.filter(s => s.length > 30);

let summary = ‘’;
let wordCount = 0;
const targetWords = 200;

// Add context
summary += `${title}. `;
wordCount += title.split(’ ’).length;

// Build summary from sentences
for (const sentence of sentences) {
const sentenceWords = sentence.split(’ ’).length;

```
if (wordCount + sentenceWords > targetWords && wordCount > 150) {
  break;
}

summary += sentence + '. ';
wordCount += sentenceWords;
```

}

// Ensure minimum length
if (wordCount < 150 && description) {
summary += ` Additional context: ${description}`;
}

// Add key facts if available
const source = article.source?.name;
const author = article.author;
const publishedDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : null;

if (source || author) {
summary += ` This report`;
if (source) summary += ` from ${source}`;
if (author) summary += ` by ${author}`;
if (publishedDate) summary += ` published on ${publishedDate}`;
summary += ’ provides important insights on this developing story.’;
}

// Clean up
summary = summary
.replace(/\s+/g, ’ ’)
.replace(/../g, ‘.’)
.replace(/.\s*./g, ‘.’)
.trim();

if (!summary.match(/[.!?]$/)) {
summary += ‘.’;
}

return summary || description || ‘Detailed summary not available for this article.’;
}