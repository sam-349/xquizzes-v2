const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    stats: {
      totalTestsTaken: { type: Number, default: 0 },
      totalQuestionsAnswered: { type: Number, default: 0 },
      totalCorrect: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      averageTimeTaken: { type: Number, default: 0 }, // in seconds
      testsCreated: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Recalculate average accuracy
userSchema.methods.updateStats = function (correctCount, totalCount, timeTaken) {
  this.stats.totalTestsTaken += 1;
  this.stats.totalQuestionsAnswered += totalCount;
  this.stats.totalCorrect += correctCount;
  this.stats.averageAccuracy =
    this.stats.totalQuestionsAnswered > 0
      ? Math.round((this.stats.totalCorrect / this.stats.totalQuestionsAnswered) * 100)
      : 0;
  const prevTotal = (this.stats.totalTestsTaken - 1) * this.stats.averageTimeTaken;
  this.stats.averageTimeTaken = Math.round((prevTotal + timeTaken) / this.stats.totalTestsTaken);
};

module.exports = mongoose.model('User', userSchema);
