const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design', 'general', 'mixed'],
    default: 'mixed'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questions: [{
    text: { type: String, required: true },
    order: { type: Number, required: true },
    category: { type: String },
    expectedKeywords: [String]
  }],
  answers: [{
    questionIndex: { type: Number, required: true },
    transcript: { type: String, default: '' },
    duration: { type: Number, default: 0 },       // seconds
    submittedAt: { type: Date, default: Date.now }
  }],
  scores: {
    communicationScore: { type: Number, min: 0, max: 10, default: 0 },
    confidenceScore: { type: Number, min: 0, max: 10, default: 0 },
    technicalScore: { type: Number, min: 0, max: 10, default: 0 },
    overallScore: { type: Number, min: 0, max: 10, default: 0 },
    strengths: [String],
    improvements: [String],
    questionScores: [{
      questionIndex: Number,
      score: Number,
      feedback: String
    }]
  },
  totalQuestions: {
    type: Number,
    default: 5
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

InterviewSessionSchema.index({ user: 1, createdAt: -1 });
InterviewSessionSchema.index({ completed: 1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
