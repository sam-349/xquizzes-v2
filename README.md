# XQuizzes - AI-Powered Test Series Generator 🧠

An intelligent test generation platform that uses **Google Gemini AI** to create customized quizzes from uploaded documents or any topic. Built with **React**, **Node.js/Express**, and **MongoDB**.

---

## 🚀 Features

### 1. Document → Custom Test Series
- Upload PDF, DOCX, or TXT study materials
- AI reads and analyzes the content
- Generates customized test questions based on the document

### 2. Topic-Based Test Generation
- Generate tests on any topic without documents
- AI pulls from general knowledge base
- Add multiple topics with weightage control

### 3. Customizable Test Configuration
- **Number of questions** (1–100)
- **Difficulty level** (Easy, Medium, Hard, Mixed)
- **Question types** (MCQ, True/False, Short Answer, Coding)
- **Bloom's Taxonomy levels** (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **Topic weightage** (percentage per topic)
- **Time limits** (configurable per test)
- **Custom instructions** for the AI

### 4. Test Taking Experience
- Clean, distraction-free test interface
- Real-time countdown timer
- Question navigator with status indicators
- Flag questions for review
- Per-question time tracking
- Confirmation before submission

### 5. AI-Powered Grading
- Auto-grading for MCQ and True/False
- AI-assisted grading for short answer and coding questions
- Detailed explanations for each answer

### 6. Analytics & Progress Tracking
- **Accuracy per topic** with bar charts
- **Progress over time** with line charts
- **Difficulty breakdown** with pie charts
- **Strengths & weaknesses** identification
- **Detailed topic breakdown** table
- Test history with all attempt details

---

## 🏗️ Architecture

```
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Layout, shared components
│   │   ├── context/        # AuthContext (React Context)
│   │   ├── pages/          # All page components
│   │   ├── services/       # API service (Axios)
│   │   └── main.jsx        # Entry point
│   └── package.json
│
├── server/                 # Node.js + Express Backend
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, file upload
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── services/       # AI service, document parser
│   │   └── index.js        # Server entry point
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Charts     | Recharts                            |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose                  |
| AI         | Google Gemini API (gemini-2.0-flash)|
| Auth       | JWT (jsonwebtoken + bcryptjs)       |
| File Parse | pdf-parse, mammoth (DOCX)           |
| Upload     | Multer                              |

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or Atlas)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

---

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/sam-349/xquizzes-v2.git
cd xquizzes-v2
```

### 2. Setup the Backend
```bash
cd server
npm install
```

Create the `.env` file (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/xquizzes
JWT_SECRET=xquizzes_super_secret_key_2024
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

> ⚠️ **Replace `your_gemini_api_key_here` with your actual Gemini API key!**

Start the server:
```bash
npm run dev
```

### 3. Setup the Frontend
```bash
cd ../client
npm install
npm run dev
```

### 4. Open the App
Navigate to **http://localhost:3000** in your browser.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint             | Description        |
|--------|---------------------|--------------------|
| POST   | /api/auth/register  | Register new user  |
| POST   | /api/auth/login     | Login              |
| GET    | /api/auth/me        | Get current user   |
| PUT    | /api/auth/profile   | Update profile     |

### Tests
| Method | Endpoint              | Description                      |
|--------|-----------------------|----------------------------------|
| POST   | /api/tests/generate   | Generate test (doc or topic)     |
| GET    | /api/tests            | Get user's tests (paginated)     |
| GET    | /api/tests/:id        | Get test with answers (review)   |
| GET    | /api/tests/:id/take   | Get test without answers (take)  |
| DELETE | /api/tests/:id        | Delete a test                    |

### Attempts
| Method | Endpoint                    | Description                |
|--------|-----------------------------|----------------------------|
| POST   | /api/attempts/:testId/submit| Submit test attempt        |
| GET    | /api/attempts/my            | Get user's attempts        |
| GET    | /api/attempts/analytics     | Get performance analytics  |
| GET    | /api/attempts/test/:testId  | Get attempts for a test    |
| GET    | /api/attempts/:attemptId    | Get attempt details        |

---

## 📊 Database Schema

### User
- `name`, `email`, `password` (hashed)
- `stats`: totalTestsTaken, averageAccuracy, testsCreated

### Test
- `title`, `description`, `generationType` (document/topic)
- `config`: totalQuestions, difficulty, questionTypes, bloomsLevels, timeLimitMinutes
- `questions[]`: questionText, options, correctAnswer, explanation, difficulty, topic
- `sourceDocument` / `sourceTopics`

### TestAttempt
- `user`, `test`, `answers[]` (with grading)
- `accuracy`, `correctAnswers`, `totalTimeTaken`
- `topicWiseScore[]`, `difficultyWiseScore[]`

---

## 🔄 Workflow

1. **Register/Login** → JWT token stored in localStorage
2. **Create Test** → Choose document or topic → Configure → AI generates questions
3. **Take Test** → Timer starts → Answer questions → Submit
4. **View Results** → Score card, topic breakdown, answer review
5. **Analytics** → Charts showing progress, strengths, weaknesses over time

---

## 🔮 Future Enhancements

- [ ] PDF export for tests and results
- [ ] Collaborative test sharing
- [ ] Spaced repetition for weak topics
- [ ] WebSocket for real-time multiplayer quizzes
- [ ] Admin dashboard for managing users/tests
- [ ] Support for image-based questions
- [ ] Switch to other AI models (OpenAI, Claude, etc.)

---

## 📄 License

MIT License - feel free to use and modify!
