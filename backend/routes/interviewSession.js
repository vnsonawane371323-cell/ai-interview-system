const express = require('express');
const router = express.Router();
const InterviewSession = require('../models/InterviewSession');
const { protect } = require('../middleware/authMiddleware');
const { generateQuestions, generateReport } = require('../services/analysisService');

// All routes are protected
router.use(protect);

// ============================================================
// POST /api/interview/start
// Start a new interview session — returns first question + session ID
// ============================================================
router.post('/start', async (req, res) => {
  try {
    const { category = 'mixed', difficulty = 'medium', totalQuestions = 5 } = req.body;
    const count = Math.min(Math.max(totalQuestions, 3), 10); // 3–10 questions

    const questions = generateQuestions(category, difficulty, count);

    const session = await InterviewSession.create({
      user: req.user._id,
      category,
      difficulty,
      questions,
      totalQuestions: count,
      currentQuestion: 0,
      answers: [],
      completed: false
    });

    res.status(201).json({
      sessionId: session._id,
      totalQuestions: count,
      currentQuestion: 0,
      question: {
        text: questions[0].text,
        category: questions[0].category,
        order: 0
      }
    });
  } catch (err) {
    console.error('Error starting interview:', err);
    res.status(500).json({ message: 'Failed to start interview session', error: err.message });
  }
});

// ============================================================
// POST /api/interview/answer
// Submit answer for current question, return next question
// ============================================================
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, transcript, duration = 0 } = req.body;

    if (!sessionId || !transcript) {
      return res.status(400).json({ message: 'sessionId and transcript are required' });
    }

    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.completed) {
      return res.status(400).json({ message: 'Interview session is already completed' });
    }

    const currentIdx = session.currentQuestion;

    // Save the answer
    session.answers.push({
      questionIndex: currentIdx,
      transcript,
      duration,
      submittedAt: new Date()
    });

    const nextIdx = currentIdx + 1;
    const isLastQuestion = nextIdx >= session.totalQuestions;

    session.currentQuestion = nextIdx;

    if (isLastQuestion) {
      // Auto-complete if last question
      session.completed = true;
      session.completedAt = new Date();

      // Generate AI report (async)
      const report = await generateReport(session.questions, session.answers, session.category, session.difficulty);
      session.scores = report;
    }

    await session.save();

    if (isLastQuestion) {
      return res.json({
        finished: true,
        completed: true,
        sessionId: session._id,
        message: 'Interview session completed! Your AI-powered report is ready.',
        report: session.scores
      });
    }

    // Return next question
    const nextQuestion = session.questions[nextIdx];
    res.json({
      finished: false,
      completed: false,
      sessionId: session._id,
      currentQuestion: nextIdx,
      totalQuestions: session.totalQuestions,
      nextQuestion: {
        text: nextQuestion.text,
        category: nextQuestion.category,
        order: nextIdx
      }
    });
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ message: 'Failed to submit answer', error: err.message });
  }
});

// ============================================================
// POST /api/interview/complete
// Force-complete an interview and generate report
// ============================================================
router.post('/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (session.completed) {
      return res.json({ report: session.scores, sessionId: session._id });
    }

    session.completed = true;
    session.completedAt = new Date();

    const report = await generateReport(session.questions, session.answers, session.category, session.difficulty);
    session.scores = report;

    await session.save();

    res.json({
      sessionId: session._id,
      message: 'Interview completed.',
      report: session.scores
    });
  } catch (err) {
    console.error('Error completing interview:', err);
    res.status(500).json({ message: 'Failed to complete interview', error: err.message });
  }
});

// ============================================================
// GET /api/interview/report/:sessionId
// Get the performance report for a session
// ============================================================
router.get('/report/:sessionId', async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.sessionId,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (!session.completed) {
      return res.status(400).json({ message: 'Interview is not yet completed' });
    }

    res.json({
      session: {
        _id: session._id,
        category: session.category,
        difficulty: session.difficulty,
        totalQuestions: session.totalQuestions,
        totalAnswered: session.answers.length,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
        scores: session.scores,
        questions: session.questions,
        answers: session.answers
      }
    });
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ message: 'Failed to fetch report', error: err.message });
  }
});

// ============================================================
// GET /api/interview/history
// Get all sessions for the current user
// ============================================================
router.get('/history', async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('category difficulty totalQuestions completed scores.overallScore createdAt completedAt')
      .limit(20);

    res.json(sessions);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ message: 'Failed to fetch interview history', error: err.message });
  }
});

// ============================================================
// GET /api/interview/stats
// Get aggregate stats for the current user
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const total = await InterviewSession.countDocuments({ user: req.user._id });
    const completed = await InterviewSession.countDocuments({ user: req.user._id, completed: true });

    const avgResult = await InterviewSession.aggregate([
      { $match: { user: req.user._id, completed: true } },
      { $group: {
        _id: null,
        avgOverall: { $avg: '$scores.overallScore' },
        avgCommunication: { $avg: '$scores.communicationScore' },
        avgConfidence: { $avg: '$scores.confidenceScore' },
        avgTechnical: { $avg: '$scores.technicalScore' }
      }}
    ]);

    const avg = avgResult[0] || { avgOverall: 0, avgCommunication: 0, avgConfidence: 0, avgTechnical: 0 };

    res.json({
      totalSessions: total,
      completedSessions: completed,
      averageScores: {
        overall: Math.round(avg.avgOverall * 10) / 10,
        communication: Math.round(avg.avgCommunication * 10) / 10,
        confidence: Math.round(avg.avgConfidence * 10) / 10,
        technical: Math.round(avg.avgTechnical * 10) / 10
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

module.exports = router;
