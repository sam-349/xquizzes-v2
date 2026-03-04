const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const User = require('../models/User');
const { gradeShortAnswer } = require('../services/aiService');

// POST /api/attempts/:testId/submit - Submit a test attempt
exports.submitAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers, startedAt, totalTimeTaken } = req.body;

    // Fetch the test with correct answers
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    // Check deadline for admin-assigned tests
    if (test.isAdminTest && test.deadline && new Date() > new Date(test.deadline)) {
      return res.status(403).json({
        message: 'This test has passed its deadline. Submission is no longer accepted.',
        deadlineExpired: true,
      });
    }

    // Grade each answer
    const gradedAnswers = [];
    for (const submittedAnswer of answers) {
      const question = test.questions.id(submittedAnswer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let marksObtained = 0;

      if (submittedAnswer.selectedAnswer) {
        if (question.questionType === 'mcq' || question.questionType === 'true_false') {
          // Exact match grading
          isCorrect =
            submittedAnswer.selectedAnswer.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase();
          marksObtained = isCorrect ? question.marks : 0;
        } else if (question.questionType === 'short_answer' || question.questionType === 'coding') {
          // AI-assisted grading
          const gradeResult = await gradeShortAnswer(question, submittedAnswer.selectedAnswer);
          isCorrect = gradeResult.isCorrect;
          marksObtained = Math.round(gradeResult.score * question.marks * 100) / 100;
        }
      }

      gradedAnswers.push({
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        selectedAnswer: submittedAnswer.selectedAnswer || '',
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeTaken: submittedAnswer.timeTaken || 0,
        topic: question.topic,
        difficulty: question.difficulty,
        marks: question.marks,
        marksObtained,
      });
    }

    // Create the attempt
    const attempt = new TestAttempt({
      user: req.userId,
      test: testId,
      answers: gradedAnswers,
      totalQuestions: test.questions.length,
      totalMarks: test.totalMarks,
      startedAt: startedAt || new Date(),
      completedAt: new Date(),
      totalTimeTaken: totalTimeTaken || 0,
      status: 'completed',
    });

    await attempt.save();

    // Update test attempt count
    test.attemptCount += 1;
    await test.save();

    // Update user stats
    const user = await User.findById(req.userId);
  user.updateStats(attempt.correctAnswers, attempt.totalQuestions, attempt.totalTimeTaken);
  await user.save();

  // Fetch fresh user data to return to client (omit sensitive fields)
  const updatedUser = await User.findById(req.userId).select('-password -__v');

    res.status(201).json({
      message: 'Test submitted and graded successfully!',
      attempt: {
        id: attempt._id,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        unanswered: attempt.unanswered,
        totalMarks: attempt.totalMarks,
        marksObtained: attempt.marksObtained,
        accuracy: attempt.accuracy,
        totalTimeTaken: attempt.totalTimeTaken,
        topicWiseScore: attempt.topicWiseScore,
        difficultyWiseScore: attempt.difficultyWiseScore,
      },
      user: updatedUser,
    });
  } catch (error) {
    console.error('SubmitAttempt error:', error);
    res.status(500).json({ message: `Failed to submit test: ${error.message}` });
  }
};

// GET /api/attempts/:attemptId - Get a specific attempt with full details
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({
      _id: req.params.attemptId,
      user: req.userId,
    }).populate('test', 'title description config');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    res.json({ attempt });
  } catch (error) {
    console.error('GetAttemptById error:', error);
    res.status(500).json({ message: 'Failed to fetch attempt.' });
  }
};

// GET /api/attempts/test/:testId - Get all attempts for a specific test by user
exports.getAttemptsByTest = async (req, res) => {
  try {
    const attempts = await TestAttempt.find({
      test: req.params.testId,
      user: req.userId,
    })
      .select('-answers')
      .sort({ createdAt: -1 });

    res.json({ attempts });
  } catch (error) {
    console.error('GetAttemptsByTest error:', error);
    res.status(500).json({ message: 'Failed to fetch attempts.' });
  }
};

// GET /api/attempts/my - Get all attempts by user
exports.getMyAttempts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attempts, total] = await Promise.all([
      TestAttempt.find({ user: req.userId })
        .populate('test', 'title description config tags')
        .select('-answers')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TestAttempt.countDocuments({ user: req.userId }),
    ]);

    res.json({
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetMyAttempts error:', error);
    res.status(500).json({ message: 'Failed to fetch attempts.' });
  }
};

// GET /api/attempts/analytics - Get user performance analytics
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all completed attempts
    const attempts = await TestAttempt.find({
      user: userId,
      status: 'completed',
    })
      .populate('test', 'title tags config')
      .sort({ createdAt: 1 });

    if (attempts.length === 0) {
      return res.json({
        overview: {
          totalTests: 0,
          averageAccuracy: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          averageTime: 0,
        },
        topicAnalysis: [],
        difficultyAnalysis: [],
        progressOverTime: [],
        recentAttempts: [],
        strengthsAndWeaknesses: { strengths: [], weaknesses: [] },
      });
    }

    // Overview
    const totalTests = attempts.length;
    const totalQuestions = attempts.reduce((s, a) => s + a.totalQuestions, 0);
    const totalCorrect = attempts.reduce((s, a) => s + a.correctAnswers, 0);
    const averageAccuracy = Math.round((totalCorrect / totalQuestions) * 100);
    const averageTime = Math.round(
      attempts.reduce((s, a) => s + a.totalTimeTaken, 0) / totalTests
    );

    // Topic-wise aggregation
    const topicMap = {};
    attempts.forEach((a) => {
      a.topicWiseScore.forEach((ts) => {
        if (!topicMap[ts.topic]) {
          topicMap[ts.topic] = { topic: ts.topic, total: 0, correct: 0 };
        }
        topicMap[ts.topic].total += ts.total;
        topicMap[ts.topic].correct += ts.correct;
      });
    });
    const topicAnalysis = Object.values(topicMap).map((t) => ({
      ...t,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    }));

    // Difficulty-wise aggregation
    const diffMap = {};
    attempts.forEach((a) => {
      a.difficultyWiseScore.forEach((ds) => {
        if (!diffMap[ds.difficulty]) {
          diffMap[ds.difficulty] = { difficulty: ds.difficulty, total: 0, correct: 0 };
        }
        diffMap[ds.difficulty].total += ds.total;
        diffMap[ds.difficulty].correct += ds.correct;
      });
    });
    const difficultyAnalysis = Object.values(diffMap).map((d) => ({
      ...d,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
    }));

    // Progress over time (accuracy per attempt)
    const progressOverTime = attempts.map((a) => ({
      date: a.createdAt,
      accuracy: a.accuracy,
      testTitle: a.test?.title || 'Unknown',
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
    }));

    // Strengths and weaknesses (topics with highest/lowest accuracy)
    const sortedTopics = [...topicAnalysis].sort((a, b) => b.accuracy - a.accuracy);
    // Strengths: top 3 topics by accuracy (with at least one question)
    const strengths = sortedTopics.filter((t) => t.total > 0).slice(0, 3);
    // Weaknesses: bottom 3 topics by accuracy (with at least one question).
    // Even if accuracies are above 60, show the bottom topics as areas to improve.
    const weaknesses = [...sortedTopics]
      .reverse()
      .filter((t) => t.total > 0)
      .slice(0, 3);

    // Recent attempts
    const recentAttempts = attempts.slice(-5).reverse().map((a) => ({
      id: a._id,
      testTitle: a.test?.title || 'Unknown',
      accuracy: a.accuracy,
      correctAnswers: a.correctAnswers,
      totalQuestions: a.totalQuestions,
      timeTaken: a.totalTimeTaken,
      date: a.createdAt,
    }));

    res.json({
      overview: {
        totalTests,
        averageAccuracy,
        totalQuestions,
        totalCorrect,
        averageTime,
      },
      topicAnalysis,
      difficultyAnalysis,
      progressOverTime,
      recentAttempts,
      strengthsAndWeaknesses: { strengths, weaknesses },
    });
  } catch (error) {
    console.error('GetAnalytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
};
