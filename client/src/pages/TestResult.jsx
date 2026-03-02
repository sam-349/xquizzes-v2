import { useLocation, useParams, Link } from 'react-router-dom';
import { Trophy, Target, Clock, CheckCircle, XCircle, Minus, ArrowRight } from 'lucide-react';

export default function TestResult() {
  const { testId } = useParams();
  const { state } = useLocation();
  const attempt = state?.attempt;

  if (!attempt) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-gray-500">No result data found.</p>
        <Link to="/my-attempts" className="btn-primary mt-4 inline-block">
          View My Attempts
        </Link>
      </div>
    );
  }

  const getGrade = (accuracy) => {
    if (accuracy >= 90) return { label: 'Excellent!', color: 'text-green-600', emoji: '🏆' };
    if (accuracy >= 70) return { label: 'Good Job!', color: 'text-blue-600', emoji: '👍' };
    if (accuracy >= 50) return { label: 'Keep Trying', color: 'text-yellow-600', emoji: '💪' };
    return { label: 'Needs Improvement', color: 'text-red-600', emoji: '📚' };
  };

  const grade = getGrade(attempt.accuracy);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score Card */}
      <div className="card text-center py-8">
        <div className="text-5xl mb-3">{grade.emoji}</div>
        <h1 className={`text-3xl font-bold ${grade.color}`}>{grade.label}</h1>
        <div className="mt-4">
          <div className="text-6xl font-bold text-gray-900">{attempt.accuracy}%</div>
          <p className="text-gray-500 mt-1">Accuracy</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center py-4">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{attempt.correctAnswers}</p>
          <p className="text-xs text-gray-500">Correct</p>
        </div>
        <div className="card text-center py-4">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{attempt.wrongAnswers}</p>
          <p className="text-xs text-gray-500">Wrong</p>
        </div>
        <div className="card text-center py-4">
          <Minus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{attempt.unanswered}</p>
          <p className="text-xs text-gray-500">Skipped</p>
        </div>
        <div className="card text-center py-4">
          <Target className="w-6 h-6 text-primary-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {attempt.marksObtained}/{attempt.totalMarks}
          </p>
          <p className="text-xs text-gray-500">Marks</p>
        </div>
      </div>

      {/* Topic Breakdown */}
      {attempt.topicWiseScore?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topic Breakdown</h2>
          <div className="space-y-3">
            {attempt.topicWiseScore.map((topic, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                  <span className="text-sm text-gray-500">
                    {topic.correct}/{topic.total} ({topic.accuracy}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      topic.accuracy >= 70
                        ? 'bg-green-500'
                        : topic.accuracy >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={`/attempt/${attempt.id}/review`}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          Review Answers <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/my-tests" className="btn-secondary flex-1 text-center">
          Back to Tests
        </Link>
        <Link to="/analytics" className="btn-secondary flex-1 text-center">
          View Analytics
        </Link>
      </div>
    </div>
  );
}
