const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  aiFeedback: {
    type: String,
    default: null
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design', 'general'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for better query performance
InterviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Interview', InterviewSchema);