# AI Interview System - Backend API

A full-stack interview management system with AI-powered feedback generation using Express.js, MongoDB, JWT authentication, and OpenAI API.

## 🚀 Features

- ✅ **User Authentication** - JWT-based registration and login
- ✅ **Interview Management** - CRUD operations for interview Q&A
- ✅ **AI Feedback Generation** - Automatic feedback using OpenAI GPT
- ✅ **Score Calculation** - 0-100 scoring based on answer quality
- ✅ **Protected Routes** - Middleware-based authentication
- ✅ **Interview Statistics** - Analytics and insights
- ✅ **Question Generation** - AI-powered interview questions

## 📁 Folder Structure

```
backend/
├── server.js                    # Express server setup
├── .env                         # Environment variables
├── package.json                 # Dependencies
├── models/
│   ├── User.js                  # User schema
│   └── Interview.js             # Interview schema with AI feedback
├── routes/
│   ├── auth.js                  # Auth routes (register/login)
│   └── interview.js             # Interview CRUD routes
├── middleware/
│   └── authMiddleware.js        # JWT authentication middleware
└── services/
    └── aiService.js             # OpenAI integration for AI feedback
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/ai-interview

# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production

# Server Port
PORT=5000

# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Start MongoDB

Make sure MongoDB is running locally:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Start the Server

```bash
node server.js
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "6990c04037a9589319d98fa0"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "6990c04037a9589319d98fa0"
}
```

#### Test Auth Routes
```http
GET /api/auth/test
```

### Interview Routes (Protected - Requires JWT)

All interview routes require the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

#### Get All Interviews
```http
GET /api/interviews
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

#### Get Single Interview
```http
GET /api/interviews/:id
Authorization: Bearer <token>
```

#### Create Interview with AI Feedback
```http
POST /api/interviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What is the difference between let and var in JavaScript?",
  "answer": "Let is block-scoped while var is function-scoped...",
  "category": "technical",
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview saved with AI feedback",
  "data": {
    "_id": "6990c5ee37a9589319d98fae",
    "question": "What is the difference between let and var?",
    "answer": "Let is block-scoped...",
    "aiFeedback": "Great answer! Your explanation covers the key differences...",
    "score": 85,
    "category": "technical",
    "difficulty": "medium",
    "user": "6990c04037a9589319d98fa0",
    "createdAt": "2026-02-15T00:00:00.000Z"
  }
}
```

#### Update Interview
```http
PUT /api/interviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "answer": "Updated answer here..."
}
```

**Note:** If the answer is updated, AI feedback will be regenerated automatically.

#### Delete Interview
```http
DELETE /api/interviews/:id
Authorization: Bearer <token>
```

#### Generate Random Question
```http
POST /api/interviews/generate-question
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "technical",
  "difficulty": "hard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "Explain the event loop in Node.js",
    "category": "technical",
    "difficulty": "hard"
  }
}
```

#### Get Interview Statistics
```http
GET /api/interviews/stats/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalInterviews": 10,
    "averageScore": 78.5,
    "highestScore": 95,
    "lowestScore": 45,
    "categories": ["technical", "behavioral"],
    "completedWithFeedback": 10
  }
}
```

## 🤖 AI Feedback System

The AI service automatically:
1. Analyzes the interview question and answer
2. Evaluates based on:
   - Technical accuracy
   - Completeness
   - Communication clarity
   - Problem-solving approach
   - Relevance to the question
3. Generates detailed constructive feedback
4. Assigns a score from 0-100

### How It Works

When you create or update an interview, `aiService.js` calls the OpenAI API:

```javascript
{
  "feedback": "Excellent explanation! You covered...",
  "score": 85
}
```

If the API fails or key is invalid, it gracefully returns a fallback message.

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Protected routes with middleware
- ✅ User ownership verification
- ✅ Input validation
- ✅ Error handling

## 🧪 Testing

Run the comprehensive test suite:

```bash
powershell -ExecutionPolicy Bypass -File test-all-routes.ps1
```

Tests include:
- Root endpoint
- Auth routes
- Protected routes
- Interview CRUD operations
- AI feedback generation
- Question generation
- Statistics
- Unauthorized access handling

## 📦 Dependencies

```json
{
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.6",
  "dotenv": "^17.3.1",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.2.1",
  "openai": "^6.22.0"
}
```

## 🎯 Interview Categories

- `technical` - Programming, algorithms, data structures
- `behavioral` - Soft skills, leadership, teamwork
- `system-design` - Architecture, scalability
- `general` - General questions

## 📊 Difficulty Levels

- `easy` - Entry-level questions
- `medium` - Intermediate level
- `hard` - Advanced questions

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🔧 Environment Setup

### MongoDB Atlas (Cloud)

If you prefer cloud MongoDB, update `.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ai-interview?retryWrites=true&w=majority
```

### OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env` file

## 📝 Schema Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Interview Model
```javascript
{
  user: ObjectId (ref: User),
  question: String,
  answer: String,
  aiFeedback: String,
  score: Number (0-100),
  category: String (enum),
  difficulty: String (enum),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎓 Usage Example

```javascript
// 1. Register
POST /api/auth/register
{ "name": "Alice", "email": "alice@test.com", "password": "pass123" }

// 2. Login
POST /api/auth/login
{ "email": "alice@test.com", "password": "pass123" }
// Returns: { token: "..." }

// 3. Create Interview (use token in Authorization header)
POST /api/interviews
Headers: { Authorization: "Bearer <token>" }
Body: {
  "question": "Explain REST API",
  "answer": "REST is an architectural style...",
  "category": "technical"
}
// AI automatically generates feedback and score

// 4. View Statistics
GET /api/interviews/stats/summary
Headers: { Authorization: "Bearer <token>" }
```

## 🔄 Updates & Maintenance

- Keep dependencies updated: `npm update`
- Monitor OpenAI API usage and costs
- Regularly backup MongoDB database
- Rotate JWT secret periodically
- Review and update AI prompts in `aiService.js`

## 📞 Support

For issues or questions:
- Check the test scripts: `test-all-routes.ps1`
- Review error logs in console
- Verify environment variables are set

## 🎉 Production Ready

This system is production-ready with:
- ✅ Proper error handling
- ✅ Input validation
- ✅ Authentication & authorization
- ✅ Database indexing
- ✅ Graceful AI fallback
- ✅ Clean code structure
- ✅ Comprehensive testing

---

**Built with Express, MongoDB, JWT, and OpenAI** 🚀
