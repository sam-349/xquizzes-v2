const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'short_answer', 'coding'],
    required: true,
  },
  options: [
    {
      label: String, // A, B, C, D
      text: String,
    },
  ],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  topic: {
    type: String,
    default: '',
  },
  bloomsLevel: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create', ''],
    default: '',
  },
  marks: {
    type: Number,
    default: 1,
  },
});

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Generation source
    generationType: {
      type: String,
      enum: ['document', 'topic'],
      required: true,
    },
    sourceDocument: {
      originalName: String,
      filePath: String,
      fileType: String,
    },
    sourceTopics: [String],
    // Configuration
    config: {
      totalQuestions: { type: Number, required: true },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'mixed'],
        default: 'medium',
      },
      questionTypes: [
        {
          type: String,
          enum: ['mcq', 'true_false', 'short_answer', 'coding'],
        },
      ],
      bloomsLevels: [
        {
          type: String,
          enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
        },
      ],
      timeLimitMinutes: { type: Number, default: 30 },
      topicWeightage: [
        {
          topic: String,
          percentage: Number,
        },
      ],
    },
    questions: [questionSchema],
    totalMarks: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Calculate total marks before saving
testSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  }
  next();
});

module.exports = mongoose.model('Test', testSchema);
