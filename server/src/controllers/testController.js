const Test = require('../models/Test');
const User = require('../models/User');
const { generateQuestions } = require('../services/aiService');
const { extractText, truncateText } = require('../services/documentParser');
const fs = require('fs');

// POST /api/tests/generate - Generate a new test (document-based or topic-based)
exports.generateTest = async (req, res) => {
  try {
    const {
      title,
      description,
      generationType, // 'document' or 'topic'
      topics,         // array of topic strings
      totalQuestions,
      difficulty,
      questionTypes,
      bloomsLevels,
      timeLimitMinutes,
      topicWeightage,
      customInstructions,
    } = req.body;

    // Parse JSON strings if sent from FormData
    const parsedTopics = typeof topics === 'string' ? JSON.parse(topics) : topics;
    const parsedQuestionTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;
    const parsedBloomsLevels = typeof bloomsLevels === 'string' ? JSON.parse(bloomsLevels) : bloomsLevels;
    const parsedTopicWeightage = typeof topicWeightage === 'string' ? JSON.parse(topicWeightage) : topicWeightage;

    let documentText = null;
    let sourceDocument = null;

    // If document-based, extract text from the uploaded file
    if (generationType === 'document') {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a document for document-based generation.' });
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

    // Build AI config
    const aiConfig = {
      totalQuestions: parseInt(totalQuestions) || 10,
      difficulty: difficulty || 'medium',
      questionTypes: parsedQuestionTypes || ['mcq'],
      bloomsLevels: parsedBloomsLevels || [],
      topics: parsedTopics || [],
      topicWeightage: parsedTopicWeightage || [],
      customInstructions: customInstructions || '',
    };

    // Generate questions via Gemini AI
    const questions = await generateQuestions(aiConfig, documentText);

    // Create the test document
    const test = new Test({
      title: title || `AI Generated Test - ${new Date().toLocaleDateString()}`,
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
    });

    await test.save();

    // Update user stats
    const user = await User.findById(req.userId);
    user.stats.testsCreated += 1;
    await user.save();

    // Clean up uploaded file after processing (optional: keep for reference)
    // if (req.file) fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Test generated successfully!',
      test: {
        id: test._id,
        title: test.title,
        description: test.description,
        generationType: test.generationType,
        config: test.config,
        totalQuestions: test.questions.length,
        totalMarks: test.totalMarks,
        createdAt: test.createdAt,
      },
    });
  } catch (error) {
    console.error('Generate test error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: `Failed to generate test: ${error.message}` });
  }
};

// GET /api/tests - Get all tests for the current user (own + assigned)
exports.getMyTests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { createdBy: req.userId },
        { assignedTo: req.userId },
      ],
    };
    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const [tests, total] = await Promise.all([
      Test.find(query)
        .select('-questions.correctAnswer -questions.explanation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Test.countDocuments(query),
    ]);

    res.json({
      tests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetMyTests error:', error);
    res.status(500).json({ message: 'Failed to fetch tests.' });
  }
};

// GET /api/tests/:id - Get a single test (with questions for taking)
exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate('createdBy', 'name email');

    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    res.json({ test });
  } catch (error) {
    console.error('GetTestById error:', error);
    res.status(500).json({ message: 'Failed to fetch test.' });
  }
};

// GET /api/tests/:id/take - Get test questions without answers (for taking the test)
exports.getTestForTaking = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    // Check deadline for admin-assigned tests
    if (test.isAdminTest && test.deadline && new Date() > new Date(test.deadline)) {
      return res.status(403).json({
        message: 'This test has passed its deadline and can no longer be taken.',
        deadlineExpired: true,
      });
    }

    // Strip answers and explanations
    const sanitizedQuestions = test.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
      bloomsLevel: q.bloomsLevel,
      marks: q.marks,
    }));

    res.json({
      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        config: test.config,
        totalMarks: test.totalMarks,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error('GetTestForTaking error:', error);
    res.status(500).json({ message: 'Failed to load test.' });
  }
};

// DELETE /api/tests/:id
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found or unauthorized.' });
    }

    // Clean up document file if exists
    if (test.sourceDocument && test.sourceDocument.filePath) {
      if (fs.existsSync(test.sourceDocument.filePath)) {
        fs.unlinkSync(test.sourceDocument.filePath);
      }
    }

    res.json({ message: 'Test deleted successfully.' });
  } catch (error) {
    console.error('DeleteTest error:', error);
    res.status(500).json({ message: 'Failed to delete test.' });
  }
};
