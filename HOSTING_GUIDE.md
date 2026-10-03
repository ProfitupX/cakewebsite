# 🚀 Sowmis Cake — Hosting & Domain Setup Guide

This guide explains how to host your website for free on **Vercel** or **Netlify** with custom domain **`sowmiscake`** (e.g. `sowmiscake.com`, `sowmiscake.in`, or `sowmiscake.vercel.app`).

---

## ⚡ Option 1: Host with Vercel (Recommended - 1 Click & Free)

### Step 1: Push latest code to GitHub
The project is already synced with your GitHub repository:
[https://github.com/ProfitupX/cakewebsite.git](https://github.com/ProfitupX/cakewebsite.git)

### Step 2: Import into Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Select `ProfitupX/cakewebsite` from the list.
4. Framework Preset will auto-detect as **Vite**.
5. Click **"Deploy"**.

### Step 3: Add your custom domain `sowmiscake`
1. In your Vercel project dashboard, click **"Settings"** → **"Domains"**.
2. Type `sowmiscake.com` (or your domain name e.g. `sowmiscake.in` / `sowmiscake.vercel.app`).
3. Click **"Add"**.
4. Configure the DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
   - **Type A**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`

---

## 🌐 Option 2: Host with Netlify

1. Go to [https://netlify.com](https://netlify.com) and sign in.
2. Click **"Add new site"** → **"Import an existing project"** → **"GitHub"**.
3. Select `ProfitupX/cakewebsite`.
4. Build command: `npm run build` | Publish directory: `dist`.
5. Click **"Deploy site"**.
6. Under **"Domain management"**, click **"Add custom domain"** and enter `sowmiscake.com`.

---

## 🤖 Built-in AI & Database Features in Sowmis Cake
- **Google Gemini Flash AI**: Automated cake recipe & kitchen inventory calculations using optimized low-token prompts.
- **Supabase Realtime**: Live inventory deduction upon cake order checkout.
- **Stock Alert System**: Realtime popups & badges for critical kitchen thresholds.
