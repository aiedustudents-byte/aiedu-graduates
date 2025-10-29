# AI EDU Graduates Platform

AI-powered education platform with community features, gamification, and AI tools.

## Netlify Deployment Setup

### Required Environment Variables

To deploy this application on Netlify, you need to set the following environment variables in your Netlify dashboard:

1. Go to **Site Settings** → **Environment Variables**
2. Click **Add variable** for each variable below
3. **Important**: Check "Contains secret values" for each variable

#### Firebase Configuration (Required)

```
VITE_FIREBASE_API_KEY = AIzaSyDIgwHL2_oAbcTr9jpGcURnTseIaAkica4
VITE_FIREBASE_AUTH_DOMAIN = ai-edu-graduates.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = ai-edu-graduates
VITE_FIREBASE_STORAGE_BUCKET = ai-edu-graduates.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 745004327373
VITE_FIREBASE_APP_ID = 1:745004327373:web:3fa580fdda4cc48080e484
VITE_FIREBASE_MEASUREMENT_ID = G-2FDRK3JRBV
```

#### Gemini API Key (Optional)

```
VITE_GEMINI_API_KEY = your_gemini_api_key_here
```

### Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Set Environment Variables**: Add all Firebase environment variables (see above)
3. **Build Settings**: Netlify will automatically detect settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy**: Click "Deploy site" or push to main branch

### Troubleshooting

#### Error: "Missing App configuration value: projectId"
- **Solution**: Make sure all Firebase environment variables are set in Netlify dashboard
- Go to Site Settings → Environment Variables and verify all `VITE_FIREBASE_*` variables are present

#### Error: "Exposed secrets detected"
- **Solution**: The `netlify.toml` file is configured to ignore these keys during scanning
- Make sure environment variables are set in Netlify (not in code)
- Check "Contains secret values" when adding variables

### Local Development

1. Install dependencies: `npm install`
2. Create a `.env` file in the root directory with your environment variables
3. Run development server: `npm run dev`

**Note**: Never commit `.env` file to git. Use `.env.example` as a template.

## Features

- 🎨 AI Artist Corner with community feed
- 🏆 Gamification system with points and leaderboards
- 👨‍💼 Admin panel for content management
- 🤖 AI Mentor powered by Google Gemini
- 📚 Course management system
- 📝 Prompt engineering tools
- 🎯 Challenge system with leaderboards

## Tech Stack

- React + TypeScript
- Vite
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- Framer Motion
- React Router DOM

