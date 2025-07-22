# PyKIDS - AI-Powered Python Tutor for Children

A modern, interactive web application designed to teach Python programming to children through engaging lessons, AI tutoring, and gamified learning experiences.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router DOM** for navigation
- **Lucide React** for icons

### Authentication
- **Firebase Authentication** (Email/Password + Google Sign-in)

### Backend (Ready for Integration)
- **Python Flask** (Your implementation)
- **PostgreSQL** (Your implementation)
- **Vector Database** (Your implementation)

## 🏗️ Architecture

### Current Setup
- Frontend: React SPA with Firebase Auth
- Mock APIs: Structured for easy Flask integration
- Data: Local state management with mock persistence

### Your Flask Backend Integration Points

#### API Endpoints to Implement

```python
# User Management
POST   /api/users/profile              # Create user profile
GET    /api/users/{userId}/profile     # Get user profile
PUT    /api/users/{userId}/profile     # Update user profile
PUT    /api/users/{userId}/avatar      # Set user avatar

# Progress Tracking
POST   /api/progress/lesson            # Update lesson progress
POST   /api/progress/quiz              # Save quiz results
GET    /api/progress/{userId}          # Get user progress

# Learning Content
GET    /api/content/modules            # Get all modules
GET    /api/content/lessons/{moduleId} # Get lessons for module
GET    /api/content/quiz/{moduleId}    # Get quiz for module

# AI/Chatbot
POST   /api/ai/chat                   # Send chat message to AI
POST   /api/ai/code-help              # Get AI code assistance

# Code Execution
POST   /api/code/execute              # Execute Python code
POST   /api/code/validate             # Validate code solution

# Analytics
POST   /api/analytics/track-event     # Track user events
GET    /api/analytics/user-stats/{userId} # Get user statistics
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pykids-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password + Google)
   - Copy your Firebase config to `src/firebase/config.ts`

4. **Set up environment variables**
   ```bash
   # Create .env file
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔌 Flask Backend Integration

### Step 1: API Service Layer
The frontend includes a complete API service layer (`src/services/api.ts`) with:
- Structured API calls for all features
- TypeScript interfaces for data models
- Mock implementations ready for replacement
- Clear TODO comments for Flask integration points

### Step 2: Replace Mock Functions
Search for `// TODO: Connect this to Flask backend` comments throughout the codebase to find integration points.

### Example Integration
```typescript
// Before (Mock)
async function getUserProfile(userId: string) {
  console.log('Mock: Getting user profile');
  return mockData;
}

// After (Flask Integration)
async function getUserProfile(userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
    headers: {
      'Authorization': `Bearer ${await getFirebaseToken()}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### Step 3: Authentication Flow
Firebase handles authentication, your Flask backend should:
1. Verify Firebase ID tokens
2. Extract user information
3. Manage user sessions/permissions

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, User)
├── data/              # Static data (curriculum, avatars)
├── firebase/          # Firebase configuration
├── pages/             # Page components
├── services/          # API service layer (ready for Flask)
└── types/             # TypeScript type definitions
```

## 🎯 Key Features

### ✅ Implemented
- Firebase Authentication (Email + Google)
- Interactive lesson system with voice-overs
- Progress tracking (local state)
- Quiz system with scoring
- AI chatbot interface (mock responses)
- Code editor with syntax highlighting
- Responsive design with animations
- Avatar selection system

### 🔄 Ready for Your Backend
- User profile management
- Progress persistence
- AI-powered tutoring
- Code execution engine
- Analytics and tracking
- Content management system

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your preferred hosting service
```

### Backend Integration Checklist
- [ ] Set up Flask application with CORS enabled
- [ ] Implement Firebase token verification
- [ ] Create PostgreSQL database schema
- [ ] Set up Vector database for AI features
- [ ] Implement all API endpoints from `src/services/api.ts`
- [ ] Update `REACT_APP_API_URL` environment variable
- [ ] Test all integration points

## 🤝 Contributing

1. Frontend changes: Modify React components as needed
2. Backend integration: Follow the API contracts in `src/services/api.ts`
3. Keep Firebase Auth unchanged
4. Maintain TypeScript interfaces for data consistency

## 📝 Notes

- All Firebase database operations have been replaced with mock API calls
- Firebase Authentication remains fully functional
- The codebase is structured for easy Flask backend integration
- Mock data simulates real application flow
- Clear separation between frontend logic and backend calls

---

**Ready for your Python/Flask backend integration!** 🐍🚀