# Double Helix Training Platform - Complete Setup Guide

This guide walks you through deploying the training platform from scratch.

**Estimated time: 30-45 minutes**

---

## Prerequisites

- GitHub account
- Netlify account (free tier is fine)
- Google Cloud Console access (for OAuth)
- Resend account (optional, for emails)
- Node.js 18+ installed locally (for CLI tools)

---

## Step 1: Set Up GitHub Repository

### Option A: Using GitHub CLI (Fastest)

```bash
# Extract the ZIP file
unzip training-platform.zip
cd training

# Install dependencies to verify everything works
npm install

# Initialize git
git init
git add .
git commit -m "Initial commit: Double Helix Training Platform"

# Create repo and push (GitHub CLI required: https://cli.github.com)
gh repo create double-helix-training --private --source=. --push
```

### Option B: Manual GitHub Setup

1. Extract `training-platform.zip` to a folder called `training`

2. Go to [github.com/new](https://github.com/new)
   - Repository name: `double-helix-training`
   - Private: ✓
   - Click **Create repository**

3. In your terminal:
   ```bash
   cd training
   npm install
   git init
   git add .
   git commit -m "Initial commit: Double Helix Training Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/double-helix-training.git
   git push -u origin main
   ```

---

## Step 2: Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)

2. Click **"Add new site"** → **"Import an existing project"**

3. Click **"Deploy with GitHub"** and authorize Netlify

4. Select your `double-helix-training` repository

5. Verify build settings:
   | Setting | Value |
   |---------|-------|
   | Branch to deploy | `main` |
   | Build command | `npm run build` |
   | Publish directory | `dist` |

6. Click **"Deploy site"**

7. Wait for the build to complete (2-3 minutes)

8. **Note your site URL** - it will be something like `https://amazing-name-123456.netlify.app`

### Optional: Set Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter `apps.double-helix.com`
4. Follow DNS configuration instructions

---

## Step 3: Install Netlify CLI

```bash
# Install globally
npm install -g netlify-cli

# Verify installation
netlify --version

# Login to Netlify
netlify login
```

This opens a browser window - click **"Authorize"**.

---

## Step 4: Set Up Database (Netlify DB / Neon)

### 4.1 Initialize Netlify DB

```bash
# Navigate to your project folder
cd training

# Link to your Netlify site
netlify link

# When prompted, select "Use current git remote origin"

# Initialize the database
npx netlify db init
```

This provisions a free Neon PostgreSQL database and automatically sets the `DATABASE_URL` environment variable.

### 4.2 Run Database Schema

1. Go to your [Netlify Dashboard](https://app.netlify.com)

2. Select your site

3. Go to **Integrations** tab

4. Find **Neon** and click **"View"** or **"Manage"**

5. Click **"Open Neon Console"**

6. In Neon Console:
   - Click on your database
   - Go to **"SQL Editor"** tab
   - Copy the entire contents of `database/schema.sql` from your project
   - Paste into the SQL Editor
   - Click **"Run"**

7. Verify: You should see "CREATE TABLE", "CREATE INDEX", etc. messages with no errors

---

## Step 5: Set Up Google OAuth (for Admin Login)

### 5.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)

2. Click the project dropdown (top left) → **"New Project"**
   - Project name: `Double Helix Training`
   - Click **"Create"**

3. Select your new project from the dropdown

### 5.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**

2. Select **"Internal"** (if using Google Workspace) or **"External"**
   - For @double-helix.com accounts only, "Internal" is simpler

3. Fill in:
   - App name: `Double Helix Training`
   - User support email: `support@double-helix.com`
   - Developer contact email: `ken@double-helix.com`

4. Click **"Save and Continue"**

5. Scopes: Click **"Save and Continue"** (defaults are fine)

6. Test users (if External): Add your email, then **"Save and Continue"**

### 5.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**

2. Click **"+ Create Credentials"** → **"OAuth client ID"**

3. Application type: **"Web application"**

4. Name: `Netlify Identity`

5. **Authorized JavaScript origins:**
   ```
   https://YOUR-SITE-NAME.netlify.app
   ```
   (Replace with your actual Netlify URL)

   If using custom domain, also add:
   ```
   https://apps.double-helix.com
   ```

6. **Authorized redirect URIs:**
   ```
   https://YOUR-SITE-NAME.netlify.app/.netlify/identity/callback
   ```
   
   If using custom domain, also add:
   ```
   https://apps.double-helix.com/.netlify/identity/callback
   ```

7. Click **"Create"**

8. **Copy and save:**
   - Client ID (looks like: `123456789-abcdef.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-xxxxxxxxxxxxx`)

---

## Step 6: Configure Netlify Identity

1. Go to your [Netlify Dashboard](https://app.netlify.com) → Select your site

2. Go to **Integrations** → **Identity** → **"Enable Identity"**

3. **Registration preferences:**
   - Select **"Invite only"**

4. **External providers:**
   - Click **"Add provider"** → **"Google"**
   - Paste your **Client ID**
   - Paste your **Client Secret**
   - Click **"Save"**

5. **Advanced settings** (optional but recommended):
   - Under **Registration**, you can add an email filter
   - To restrict to only @double-helix.com, the auth.js file already handles this

### 6.1 Invite Yourself as First Admin

1. Still in Identity settings, click **"Identity"** tab (under Site settings)

2. Click **"Invite users"**

3. Enter your @double-helix.com email

4. Check your email and accept the invitation

---

## Step 7: Set Up Resend (Email)

### 7.1 Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up

2. Verify your email

### 7.2 Add Your Domain

1. In Resend dashboard, go to **Domains**

2. Click **"Add Domain"**

3. Enter: `double-helix.com`

4. Add the DNS records Resend provides:
   - Usually 3 TXT records and sometimes an MX record
   - Add these in your DNS provider (Cloudflare, GoDaddy, etc.)

5. Click **"Verify"** (may take a few minutes for DNS to propagate)

### 7.3 Get API Key

1. Go to **API Keys** in Resend dashboard

2. Click **"Create API Key"**
   - Name: `Training Platform`
   - Permissions: **Sending access** → Full access
   
3. **Copy the API key** (you won't see it again!)

---

## Step 8: Configure Environment Variables

1. Go to **Netlify Dashboard** → Your site → **Site configuration** → **Environment variables**

2. Add these variables:

   | Key | Value |
   |-----|-------|
   | `RESEND_API_KEY` | `re_xxxxxxxxx` (your Resend API key) |
   | `EMAIL_FROM` | `training@double-helix.com` |

   Note: `DATABASE_URL` was automatically added by `netlify db init`

3. Click **"Save"**

---

## Step 9: Redeploy

Environment variables require a redeploy to take effect:

1. Go to **Deploys** tab

2. Click **"Trigger deploy"** → **"Deploy site"**

3. Wait for build to complete

---

## Step 10: Test Everything

### 10.1 Test Public Pages

1. Visit `https://YOUR-SITE.netlify.app/training/`
   - Should see the home page

### 10.2 Test Admin Login

1. Visit `https://YOUR-SITE.netlify.app/training/admin`

2. Click **"Sign in with Google"**

3. Log in with your @double-helix.com Google account

4. Should redirect to Admin Dashboard

### 10.3 Create a Test Course

1. In Admin Dashboard, click **"Create New Course"**

2. Fill in:
   - Name: `Test Training Course`
   - Slug: `test-course`
   - Number of Days: `2`

3. Click **"Create Course"**

4. Add a trainer in the **Trainers** tab

5. Add a survey question in the **Days & Surveys** tab

### 10.4 Test Attendance

1. Open a new incognito/private browser window

2. Visit `https://YOUR-SITE.netlify.app/training/attend/test-course/1`

3. Enter test details and submit

4. Go back to Admin → Your Course → Attendance
   - Should see your test attendance

### 10.5 Test Certificates

1. Complete attendance for all days (Day 1 and Day 2)

2. Go to Admin → Your Course → Certificates

3. Click **"Generate Certificates"**

4. Select the certificate and click **"Send Emails"**

5. Check your email for the certificate link

---

## Troubleshooting

### "Unauthorized" on Admin Pages

- Make sure your email ends with `@double-helix.com`
- Check that Netlify Identity has Google provider configured
- Try logging out and back in

### Database Errors

- Verify schema was run in Neon console
- Check that `DATABASE_URL` exists in Netlify environment variables
- Redeploy after adding environment variables

### Email Not Sending

- Verify domain is verified in Resend
- Check `RESEND_API_KEY` is set correctly
- Check Resend dashboard for failed sends

### Build Failures

- Check the deploy log in Netlify
- Make sure all files from the ZIP were extracted correctly
- Verify `package.json` exists in root directory

### Google OAuth Errors

- Verify redirect URIs match exactly (including https://)
- Make sure OAuth consent screen is configured
- Check that the Google OAuth Client ID/Secret are correct in Netlify Identity

---

## Quick Reference

| What | Where |
|------|-------|
| Site URL | `https://YOUR-SITE.netlify.app/training/` |
| Admin Login | `https://YOUR-SITE.netlify.app/training/admin` |
| Attendance URL | `https://YOUR-SITE.netlify.app/training/attend/{slug}/{day}` |
| Certificate Verify | `https://YOUR-SITE.netlify.app/training/cert/{code}` |
| Netlify Dashboard | [app.netlify.com](https://app.netlify.com) |
| Neon Console | Netlify → Integrations → Neon → Open Console |
| Resend Dashboard | [resend.com/emails](https://resend.com/emails) |

---

## Adding Your Logo

1. Create or obtain your logo as a PNG file

2. Name it `logo.png`

3. Add to your repo at `public/images/logo.png`

4. Commit and push:
   ```bash
   git add public/images/logo.png
   git commit -m "Add company logo"
   git push
   ```

5. Netlify will auto-redeploy

---

## Local Development (Optional)

If you want to make changes and test locally:

```bash
cd training

# Pull environment variables from Netlify
netlify env:pull

# Start local dev server
netlify dev
```

Visit `http://localhost:8888/training/`

This runs both the React app and serverless functions locally.

---

## Support

If you run into issues:
1. Check the Netlify deploy logs
2. Check browser console for JavaScript errors
3. Check Netlify function logs (Functions tab in Netlify dashboard)

---

*Guide created for Double Helix LLC - February 2025*
