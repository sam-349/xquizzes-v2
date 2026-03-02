import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testAPI, attemptAPI } from '../services/api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [questionTimes, setQuestionTimes] = useState({});
  const lastTimestamp = useRef(Date.now());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft > 0]);

  // Track time per question
  useEffect(() => {
    lastTimestamp.current = Date.now();
  }, [currentIndex]);

  const fetchTest = async () => {
    try {
      const res = await testAPI.getForTaking(testId);
      setTest(res.data.test);
      setTimeLeft((res.data.test.config?.timeLimitMinutes || 30) * 60);
    } catch (error) {
      toast.error('Failed to load test.');
      navigate('/my-tests');
    } finally {
      setLoading(false);
    }
  };

  const recordQuestionTime = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.round((now - lastTimestamp.current) / 1000);
    const qId = test?.questions[currentIndex]?._id;
    if (qId) {
      setQuestionTimes((prev) => ({
        ...prev,
        [qId]: (prev[qId] || 0) + elapsed,
      }));
    }
    lastTimestamp.current = now;
  }, [currentIndex, test]);

  const selectAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const goToQuestion = (index) => {
    recordQuestionTime();
    setCurrentIndex(index);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    recordQuestionTime();
    setSubmitting(true);

    try {
      const totalTime = (test.config?.timeLimitMinutes || 30) * 60 - timeLeft;
      const formattedAnswers = test.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || '',
        timeTaken: questionTimes[q._id] || 0,
      }));

      const res = await attemptAPI.submit(testId, {
        answers: formattedAnswers,
        startedAt,
        totalTimeTaken: totalTime,
      });

      toast.success(autoSubmit ? 'Time up! Test submitted.' : 'Test submitted successfully!');
      navigate(`/attempt/${res.data.attempt.id}/review`, { state: { attempt: res.data.attempt } });
    } catch (error) {
      toast.error('Failed to submit test.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!test) return null;

  const currentQuestion = test.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{test.title}</h1>
          <p className="text-sm text-gray-500">
            {answeredCount}/{totalQuestions} answered
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg font-bold ${
              timeLeft < 60
                ? 'bg-red-100 text-red-700 animate-pulse'
                : timeLeft < 300
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Clock className="w-5 h-5" />
            {Math.floor(timeLeft / 60)
              .toString()
              .padStart(2, '0')}
            :{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="btn-success flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Submit
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="card border-yellow-300 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">
                Are you sure you want to submit?
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {totalQuestions - answeredCount > 0
                  ? `You have ${totalQuestions - answeredCount} unanswered question(s).`
                  : 'All questions are answered.'}
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleSubmit(true)} className="btn-success text-sm py-1.5 px-4">
                  Yes, Submit
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-secondary text-sm py-1.5 px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Question Panel */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-2">
              <span className={`badge-${currentQuestion.difficulty}`}>
                {currentQuestion.difficulty}
              </span>
              {currentQuestion.topic && (
                <span className="badge bg-blue-100 text-blue-800">{currentQuestion.topic}</span>
              )}
              <button
                onClick={() => toggleFlag(currentQuestion._id)}
                className={`p-1 rounded ${
                  flagged.has(currentQuestion._id)
                    ? 'text-orange-500'
                    : 'text-gray-300 hover:text-orange-400'
                }`}
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
            {currentQuestion.questionText}
          </h2>

          {/* Answer area */}
          {currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'true_false' ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => selectAnswer(currentQuestion._id, option.label)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion._id] === option.label
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        answers[currentQuestion._id] === option.label
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="text-gray-800">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="input-field"
              rows={6}
              placeholder={
                currentQuestion.questionType === 'coding'
                  ? 'Write your code here...'
                  : 'Type your answer here...'
              }
              value={answers[currentQuestion._id] || ''}
              onChange={(e) => selectAnswer(currentQuestion._id, e.target.value)}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary flex items-center gap-1 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-400">
              {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => goToQuestion(Math.min(totalQuestions - 1, currentIndex + 1))}
              disabled={currentIndex === totalQuestions - 1}
              className="btn-secondary flex items-center gap-1 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="card lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Questions</h3>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
            {test.questions.map((q, i) => (
              <button
                key={q._id}
                onClick={() => goToQuestion(i)}
                className={`w-full aspect-square rounded-lg text-sm font-medium flex items-center justify-center border-2 transition-all relative ${
                  i === currentIndex
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : answers[q._id]
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {i + 1}
                {flagged.has(q._id) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-primary-100 border border-primary-300" /> Current
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" /> Unanswered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-400 rounded-full" /> Flagged
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
