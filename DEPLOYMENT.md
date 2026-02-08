# 🚀 CLOUVA Deployment Guide - OAuth Configuration

## ⚠️ IMPORTANT: Configure Appwrite OAuth for Production

After deploying CLOUVA to Vercel, you must update your Appwrite OAuth redirect URLs to allow production authentication.

### Step 1: Access Appwrite Console

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your CLOUVA project
3. Navigate to **Auth** → **Settings**

### Step 2: Add Production Redirect URLs

In the **Success URL** and **Failure URL** sections, add your Vercel deployment URL:

**Success URLs:**
```
https://clouva-ten.vercel.app/dashboard
http://localhost:5173/dashboard
```

**Failure URLs:**
```
https://clouva-ten.vercel.app/login?failure=true
http://localhost:5173/login?failure=true
```

> **Note:** Keep localhost URLs for local development testing.

### Step 3: Configure Google OAuth Provider

1. In Appwrite Console, go to **Auth** → **Settings** → **OAuth2 Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

4. In **Google Cloud Console**, add authorized redirect URIs:
   ```
   https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/YOUR_PROJECT_ID
   ```

### Step 4: Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_BREVO_API_KEY=your_brevo_api_key
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
VITE_APP_URL=https://clouva-ten.vercel.app
```

### Step 5: Redeploy

After setting environment variables, redeploy your Vercel app for changes to take effect.

---

## ✅ What Was Fixed

The code has been updated to use dynamic redirect URLs instead of hardcoded localhost:

**Before:**
```javascript
account.createOAuth2Session(
    OAuthProvider.Google,
    'http://localhost:5173/dashboard',
    'http://localhost:5173/login?failure=true'
);
```

**After:**
```javascript
account.createOAuth2Session(
    OAuthProvider.Google,
    `${window.location.origin}/dashboard`,
    `${window.location.origin}/login?failure=true`
);
```

This ensures users are redirected to the correct URL whether on localhost or production.

---

## 🔍 Troubleshooting

**Issue:** Still redirecting to localhost after deployment
- **Solution:** Clear browser cache and cookies, then try again

**Issue:** OAuth popup closes immediately
- **Solution:** Check Appwrite console for success/failure URL configuration

**Issue:** "Redirect URI mismatch" error
- **Solution:** Ensure ALL redirect URLs are added in both Appwrite and Google Cloud Console

---

**Your production URL:** https://clouva-ten.vercel.app
