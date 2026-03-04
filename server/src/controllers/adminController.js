const User = require('../models/User');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Notification = require('../models/Notification');
const { generateQuestions } = require('../services/aiService');
const { extractText, truncateText } = require('../services/documentParser');
const fs = require('fs');

// GET /api/admin/stats - Admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalTests, totalAttempts, recentUsers] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Test.countDocuments(),
      TestAttempt.countDocuments(),
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email stats createdAt'),
    ]);

    // Average accuracy across all attempts
    const accuracyAgg = await TestAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' } } },
    ]);
    const avgAccuracy = accuracyAgg.length > 0 ? Math.round(accuracyAgg[0].avgAccuracy) : 0;

    // Tests created by admin
    const adminTests = await Test.countDocuments({ isAdminTest: true });

    res.json({
      totalUsers,
      totalTests,
      totalAttempts,
      avgAccuracy,
      adminTests,
      recentUsers,
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
};

// GET /api/admin/users - Get all users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email stats createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// GET /api/admin/users/:id/report - Get detailed report for a user
exports.getUserReport = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Get all attempts by this user
    const attempts = await TestAttempt.find({ user: req.params.id })
      .populate('test', 'title config generationType sourceTopics isAdminTest')
      .sort({ createdAt: -1 });

    // Topic-wise performance
    const topicMap = {};
    attempts.forEach((attempt) => {
      if (attempt.topicWiseScore) {
        attempt.topicWiseScore.forEach((ts) => {
          if (!topicMap[ts.topic]) {
            topicMap[ts.topic] = { total: 0, correct: 0 };
          }
          topicMap[ts.topic].total += ts.total;
          topicMap[ts.topic].correct += ts.correct;
        });
      }
    });

    const topicAnalysis = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    // Progress over time
    const progressOverTime = attempts
      .slice()
      .reverse()
      .map((a) => ({
        date: a.createdAt.toISOString().split('T')[0],
        accuracy: a.accuracy || 0,
        testTitle: a.test?.title || 'Deleted Test',
      }));

    // Admin-assigned test performance
    const adminTestAttempts = attempts.filter((a) => a.test?.isAdminTest);

    res.json({
      user,
      summary: {
        totalAttempts: attempts.length,
        averageAccuracy: user.stats.averageAccuracy,
        testsCreated: user.stats.testsCreated,
        adminTestsCompleted: adminTestAttempts.length,
      },
      topicAnalysis,
      progressOverTime,
      recentAttempts: attempts.slice(0, 10).map((a) => ({
        _id: a._id,
        test: a.test,
        scores: {
          correct: a.correctAnswers,
          total: a.totalQuestions,
          percentage: a.accuracy,
        },
        timeTaken: a.totalTimeTaken,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin getUserReport error:', error);
    res.status(500).json({ message: 'Failed to fetch user report.' });
  }
};

// GET /api/admin/tests - Get all admin-created tests
exports.getAdminTests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isAdminTest: true };

    const [tests, total] = await Promise.all([
      Test.find(query)
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name email')
        .select('-questions.correctAnswer -questions.explanation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Test.countDocuments(query),
    ]);

    // Get attempt counts for each test
    const testsWithStats = await Promise.all(
      tests.map(async (test) => {
        const attemptCount = await TestAttempt.countDocuments({ test: test._id });
        const completedUsers = await TestAttempt.distinct('user', { test: test._id });
        return {
          ...test.toObject(),
          attemptCount,
          completedCount: completedUsers.length,
          assignedCount: test.assignedTo.length,
        };
      })
    );

    res.json({
      tests: testsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Admin getAdminTests error:', error);
    res.status(500).json({ message: 'Failed to fetch admin tests.' });
  }
};

// POST /api/admin/tests/generate - Admin generates a test
exports.generateAdminTest = async (req, res) => {
  try {
    const {
      title,
      description,
      generationType,
      topics,
      totalQuestions,
      difficulty,
      questionTypes,
      bloomsLevels,
      timeLimitMinutes,
      topicWeightage,
      customInstructions,
      assignedTo, // array of user IDs
      deadline,
    } = req.body;

    const parsedTopics = typeof topics === 'string' ? JSON.parse(topics) : topics;
    const parsedQuestionTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;
    const parsedBloomsLevels = typeof bloomsLevels === 'string' ? JSON.parse(bloomsLevels) : bloomsLevels;
    const parsedTopicWeightage = typeof topicWeightage === 'string' ? JSON.parse(topicWeightage) : topicWeightage;
    const parsedAssignedTo = typeof assignedTo === 'string' ? JSON.parse(assignedTo) : assignedTo;

    let documentText = null;
    let sourceDocument = null;

    if (generationType === 'document') {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a document.' });
      }
      const rawText = await extractText(req.file.path);
      documentText = truncateText(rawText);
      sourceDocument = {
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
      };
    } else if (generationType === 'topic') {
      if (!parsedTopics || parsedTopics.length === 0) {
        return res.status(400).json({ message: 'Please provide at least one topic.' });
      }
    }

    const aiConfig = {
      totalQuestions: parseInt(totalQuestions) || 10,
      difficulty: difficulty || 'medium',
      questionTypes: parsedQuestionTypes || ['mcq'],
      bloomsLevels: parsedBloomsLevels || [],
      topics: parsedTopics || [],
      topicWeightage: parsedTopicWeightage || [],
      customInstructions: customInstructions || '',
    };

    const questions = await generateQuestions(aiConfig, documentText);

    const test = new Test({
      title: title || `Admin Test - ${new Date().toLocaleDateString()}`,
      description: description || '',
      createdBy: req.userId,
      generationType,
      sourceDocument,
      sourceTopics: parsedTopics || [],
      config: {
        totalQuestions: questions.length,
        difficulty: aiConfig.difficulty,
        questionTypes: aiConfig.questionTypes,
        bloomsLevels: aiConfig.bloomsLevels,
        timeLimitMinutes: parseInt(timeLimitMinutes) || 30,
        topicWeightage: aiConfig.topicWeightage,
      },
      questions,
      tags: parsedTopics || [],
      isAdminTest: true,
      assignedTo: parsedAssignedTo || [],
      deadline: deadline || null,
    });

    await test.save();

    // Send notifications to assigned users
    if (parsedAssignedTo && parsedAssignedTo.length > 0) {
      const notifications = parsedAssignedTo.map((userId) => ({
        user: userId,
        type: 'test_assigned',
        title: 'New Test Assigned',
        message: `Admin has assigned you a new test: "${test.title}"`,
        link: `/test/${test._id}/take`,
        metadata: {
          testId: test._id,
          assignedBy: req.userId,
        },
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: 'Admin test created and assigned!',
      test: {
        id: test._id,
        title: test.title,
        assignedTo: test.assignedTo,
        totalQuestions: test.questions.length,
      },
    });
  } catch (error) {
    console.error('Admin generate test error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: `Failed to generate test: ${error.message}` });
  }
};

// PUT /api/admin/tests/:id/assign - Assign existing test to more users
exports.assignTest = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Please provide user IDs.' });
    }

    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    // Add new user IDs (avoid duplicates)
    const existingIds = test.assignedTo.map((id) => id.toString());
    const newUserIds = userIds.filter((id) => !existingIds.includes(id));

    test.assignedTo.push(...newUserIds);
    await test.save();

    // Send notifications to newly assigned users
    if (newUserIds.length > 0) {
      const notifications = newUserIds.map((userId) => ({
        user: userId,
        type: 'test_assigned',
        title: 'New Test Assigned',
        message: `Admin has assigned you a test: "${test.title}"`,
        link: `/test/${test._id}/take`,
        metadata: { testId: test._id, assignedBy: req.userId },
      }));
      await Notification.insertMany(notifications);
    }

    res.json({
      message: `Test assigned to ${newUserIds.length} new user(s).`,
      assignedTo: test.assignedTo,
    });
  } catch (error) {
    console.error('Admin assignTest error:', error);
    res.status(500).json({ message: 'Failed to assign test.' });
  }
};
