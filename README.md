# AI Education Platform for Graduates

A comprehensive AI-powered education platform built with React, TypeScript, and Firebase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Gemini API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aiedustudents-byte/aiedu-graduates.git
   cd aiedu-graduates
   ```

2. **Install dependencies**
   ```bash
   cd project
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `project` directory with:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🛠️ Deployment

### Netlify Deployment

The project is configured for Netlify deployment with the following settings:

- **Base directory**: `project`
- **Build command**: `npm run build`
- **Publish directory**: `project/dist`

Environment variables are configured in `netlify.toml` for automatic deployment.

### Manual Environment Variable Setup

If you need to set up environment variables manually in Netlify:

1. Go to your Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Add the following variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_GEMINI_API_KEY`

## 📁 Project Structure

```
project/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   │   ├── admin/     # Admin dashboard pages
│   │   └── student/   # Student interface pages
│   ├── contexts/      # React contexts
│   ├── lib/          # Firebase configuration
│   └── utils/        # Utility functions
├── dist/             # Built files for production
└── supabase/         # Database migrations
```

## 🔧 Features

- **Student Dashboard**: AI tools, courses, career guidance
- **Admin Panel**: Course management, job posting, student management
- **Firebase Integration**: Authentication and database
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety

## 📝 License

MIT License - see LICENSE file for details.
