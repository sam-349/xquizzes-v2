import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attemptAPI } from '../services/api';
import { CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function AttemptReview() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const res = await attemptAPI.getById(attemptId);
      setAttempt(res.data.attempt);
    } catch (error) {
      console.error('Fetch attempt error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Attempt not found.</p>
        <Link to="/my-attempts" className="btn-primary mt-4 inline-block">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {attempt.test?.title || 'Test Review'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Score: {attempt.correctAnswers}/{attempt.totalQuestions} ({attempt.accuracy}%) •
            Time: {Math.floor(attempt.totalTimeTaken / 60)}m {attempt.totalTimeTaken % 60}s
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/analytics" className="btn-secondary text-sm">Analytics</Link>
          <Link to="/my-attempts" className="btn-secondary text-sm">All Attempts</Link>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {attempt.answers.map((answer, index) => (
          <div key={answer._id || index} className="card">
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() =>
                setExpandedQuestion(expandedQuestion === index ? null : index)
              }
            >
              {/* Status icon */}
              {!answer.selectedAnswer ? (
                <MinusCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              ) : answer.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
                  <span className={`badge-${answer.difficulty || 'medium'}`}>
                    {answer.difficulty}
                  </span>
                  {answer.topic && (
                    <span className="badge bg-blue-100 text-blue-800">{answer.topic}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">{answer.questionText}</p>
              </div>

              {expandedQuestion === index ? (
                <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
              )}
            </div>

            {expandedQuestion === index && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 w-24 shrink-0">
                    Your Answer:
                  </span>
                  <span
                    className={`text-sm ${
                      answer.isCorrect ? 'text-green-700 font-medium' : 'text-red-700'
                    }`}
                  >
                    {answer.selectedAnswer || '(Not answered)'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 w-24 shrink-0">
                    Correct:
                  </span>
                  <span className="text-sm text-green-700 font-medium">
                    {answer.correctAnswer}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 w-24 shrink-0">
                    Marks:
                  </span>
                  <span className="text-sm text-gray-700">
                    {answer.marksObtained}/{answer.marks}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
