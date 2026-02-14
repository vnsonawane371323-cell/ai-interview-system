# AI Interview System

A full-stack AI-powered interview practice platform built with React, Node.js, and OpenAI.

## Features

- **User Authentication** - Secure registration and login with JWT
- **AI-Powered Feedback** - Get instant feedback on your interview answers using OpenAI
- **Question Generation** - AI generates interview questions by category and difficulty
- **Progress Tracking** - Track your interview history, scores, and improvement
- **Multiple Categories** - Technical, Behavioral, System Design, and General questions
- **Difficulty Levels** - Easy, Medium, and Hard questions

## Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS v4
- React Router v7
- Axios

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JWT Authentication
- OpenAI API

## Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- OpenAI API Key (optional - fallback feedback provided)

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ai-interview-system
```

### 2. Install dependencies
```bash
# Install all dependencies (backend + frontend)
npm run install:all
```

### 3. Set up environment variables

**Backend** - Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your-secret-key-here
PORT=5000
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=development
```

**Frontend** - Create `frontend/.env` (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the application

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 5173
```

### 5. Build for production
```bash
npm run build
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/test` | Test auth route |

### Interviews (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interviews` | Get all user interviews |
| GET | `/api/interviews/:id` | Get single interview |
| POST | `/api/interviews` | Create interview with AI feedback |
| PUT | `/api/interviews/:id` | Update interview |
| DELETE | `/api/interviews/:id` | Delete interview |
| POST | `/api/interviews/generate-question` | Generate AI question |
| GET | `/api/interviews/stats/summary` | Get user stats |

## Deployment

### Render / Railway / Heroku
1. Set environment variables in the platform dashboard
2. Set `NODE_ENV=production`
3. Build command: `cd frontend && npm install && npm run build`
4. Start command: `cd backend && npm start`

### Environment Variables for Production
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `PORT` | No | Server port (default: 5000) |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |
| `NODE_ENV` | Yes | Set to `production` |
| `CORS_ORIGIN` | No | Allowed origins (comma-separated) |

## License

ISC
