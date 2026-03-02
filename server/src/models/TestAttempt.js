const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionText: String,
  questionType: String,
  selectedAnswer: {
    type: String,
    default: '',
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  timeTaken: {
    type: Number, // seconds spent on this question
    default: 0,
  },
  topic: String,
  difficulty: String,
  marks: { type: Number, default: 1 },
  marksObtained: { type: Number, default: 0 },
});

const testAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    answers: [answerSchema],
    // Scores
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    unanswered: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number, // percentage
      default: 0,
    },
    // Time tracking
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    totalTimeTaken: {
      type: Number, // seconds
      default: 0,
    },
    // Analytics breakdown
    topicWiseScore: [
      {
        topic: String,
        total: Number,
        correct: Number,
        accuracy: Number,
      },
    ],
    difficultyWiseScore: [
      {
        difficulty: String,
        total: Number,
        correct: Number,
        accuracy: Number,
      },
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: compute analytics breakdowns
testAttemptSchema.pre('save', function (next) {
  if (this.status === 'completed' && this.answers.length > 0) {
    // Topic-wise
    const topicMap = {};
    const diffMap = {};

    this.answers.forEach((a) => {
      // Topic
      const t = a.topic || 'General';
      if (!topicMap[t]) topicMap[t] = { topic: t, total: 0, correct: 0 };
      topicMap[t].total += 1;
      if (a.isCorrect) topicMap[t].correct += 1;

      // Difficulty
      const d = a.difficulty || 'medium';
      if (!diffMap[d]) diffMap[d] = { difficulty: d, total: 0, correct: 0 };
      diffMap[d].total += 1;
      if (a.isCorrect) diffMap[d].correct += 1;
    });

    this.topicWiseScore = Object.values(topicMap).map((item) => ({
      ...item,
      accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
    }));

    this.difficultyWiseScore = Object.values(diffMap).map((item) => ({
      ...item,
      accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
    }));

    // Overall
    this.correctAnswers = this.answers.filter((a) => a.isCorrect).length;
    this.wrongAnswers = this.answers.filter((a) => a.selectedAnswer && !a.isCorrect).length;
    this.unanswered = this.answers.filter((a) => !a.selectedAnswer).length;
    this.marksObtained = this.answers.reduce((sum, a) => sum + a.marksObtained, 0);
    this.accuracy =
      this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;
  }
  next();
});

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
