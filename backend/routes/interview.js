const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { protect } = require('../middleware/authMiddleware');
const { generateInterviewFeedback, generateInterviewQuestion } = require('../services/aiService');

// ============ GET ALL INTERVIEWS FOR USER ============
router.get('/', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews',
      error: error.message
    });
  }
});

// ============ GET SINGLE INTERVIEW ============
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('user', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interview',
      error: error.message
    });
  }
});

// ============ CREATE NEW INTERVIEW WITH AI FEEDBACK ============
router.post('/', protect, async (req, res) => {
  try {
    const { question, answer, category = 'general', difficulty = 'medium' } = req.body;

    // Validation
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    // Generate AI feedback and score
    console.log('Generating AI feedback...');
    const aiResult = await generateInterviewFeedback(question, answer, category);

    // Create interview with AI feedback
    const interview = await Interview.create({
      user: req.user._id,
      question: question.trim(),
      answer: answer.trim(),
      aiFeedback: aiResult.feedback,
      score: aiResult.score,
      category,
      difficulty
    });

    // Populate user data
    await interview.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Interview saved with AI feedback',
      data: interview
    });

  } catch (error) {
    console.error('Interview creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating interview',
      error: error.message
    });
  }
});

// ============ UPDATE INTERVIEW ============
router.put('/:id', protect, async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }

    // If answer changed, regenerate AI feedback
    let aiResult = null;
    if (answer && answer !== interview.answer) {
      console.log('Answer changed, regenerating AI feedback...');
      aiResult = await generateInterviewFeedback(
        question || interview.question,
        answer,
        category || interview.category
      );
    }

    // Update interview
    const updateData = {};
    if (question) updateData.question = question.trim();
    if (answer) updateData.answer = answer.trim();
    if (category) updateData.category = category;
    if (difficulty) updateData.difficulty = difficulty;
    if (aiResult) {
      updateData.aiFeedback = aiResult.feedback;
      updateData.score = aiResult.score;
    }

    const updatedInterview = await Interview.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      message: 'Interview updated successfully',
      data: updatedInterview
    });

  } catch (error) {
    console.error('Interview update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating interview',
      error: error.message
    });
  }
});

// ============ DELETE INTERVIEW ============
router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this interview'
      });
    }

    await Interview.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting interview',
      error: error.message
    });
  }
});

// ============ GENERATE RANDOM QUESTION ============
router.post('/generate-question', protect, async (req, res) => {
  try {
    const { category = 'technical', difficulty = 'medium' } = req.body;

    const question = await generateInterviewQuestion(category, difficulty);

    res.json({
      success: true,
      data: {
        question,
        category,
        difficulty
      }
    });

  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating question',
      error: error.message
    });
  }
});

// ============ GET INTERVIEW STATISTICS ============
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Interview.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' },
          categories: { $addToSet: '$category' },
          completedWithFeedback: {
            $sum: { $cond: [{ $ne: ['$aiFeedback', null] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalInterviews: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      categories: [],
      completedWithFeedback: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interview statistics',
      error: error.message
    });
  }
});

module.exports = router;