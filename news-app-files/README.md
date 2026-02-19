# 🔒 Secure News App with Hidden API Key

Your personalized news app with API key securely stored on the backend.

## 📦 **What's Included:**

- `index.html` - Frontend (users see this)
- `api/news.js` - Backend serverless function (API key hidden here)
- `vercel.json` - Configuration for Vercel deployment

## 🚀 **Deployment Steps:**

### **Step 1: Get NewsAPI Key**

1. Go to: https://newsapi.org
2. Sign up (free - 100 requests/day)
3. Copy your API key
4. Keep it secret!

### **Step 2: Deploy to Vercel**

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Click **"Import Git Repository"**
5. Connect your GitHub repo: `news-app`
6. Vercel will auto-detect the configuration

### **Step 3: Add Secret API Key**

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add variable:
   - **Name**: `NEWS_API_KEY`
   - **Value**: [paste your NewsAPI key]
   - **Environment**: Production
4. Click **"Save"**

### **Step 4: Redeploy**

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait 1-2 minutes
4. Your app is live! 🎉

## ✅ **Your URL:**

`https://your-project-name.vercel.app`

## 🔒 **Security:**

✅ API key never exposed to users
✅ Backend handles all API calls
✅ Users can't see your key in browser
✅ Rate limits protected
✅ Free SSL/HTTPS included

## 📝 **How It Works:**

```
User Browser → index.html → /api/news → NewsAPI.org
                 (frontend)   (backend)   (with secret key)
```

The API key stays on Vercel's servers, never sent to browsers!

## 🎯 **Customize Topics:**

Edit `api/news.js` and change the topics array:

```javascript
const topics = [
  { query: 'your topic here', category: 'Category Name' },
  // Add more topics...
];
```

## 💰 **Free Tier Limits:**

- Vercel: Unlimited deployments
- NewsAPI: 100 requests/day (free)
- Perfect for personal use!

## 🔄 **Update Your App:**

1. Edit files on GitHub
2. Push changes
3. Vercel auto-deploys
4. Live in 1 minute!

---

**Need help?** Check Vercel docs: https://vercel.com/docs
