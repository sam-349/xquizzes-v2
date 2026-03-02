import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attemptAPI } from '../services/api';
import { ClipboardList, Clock, Target } from 'lucide-react';

export default function MyAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchAttempts();
  }, [page]);

  const fetchAttempts = async () => {
    try {
      const res = await attemptAPI.getMy({ page, limit: 10 });
      setAttempts(res.data.attempts);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Fetch attempts error:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attempts</h1>
        <p className="text-gray-500 mt-1">{pagination?.total || 0} test attempts</p>
      </div>

      {attempts.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No attempts yet. Take a test to get started!</p>
          <Link to="/my-tests" className="btn-primary mt-4 inline-block">
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <Link
              key={attempt._id}
              to={`/attempt/${attempt._id}/review`}
              className="card hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center gap-4">
                {/* Score circle */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                    attempt.accuracy >= 70
                      ? 'bg-green-100 text-green-700'
                      : attempt.accuracy >= 40
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {attempt.accuracy}%
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {attempt.test?.title || 'Test'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {attempt.correctAnswers}/{attempt.totalQuestions} correct
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(attempt.totalTimeTaken / 60)}m {attempt.totalTimeTaken % 60}s
                    </span>
                    <span>
                      {attempt.marksObtained}/{attempt.totalMarks} marks
                    </span>
                  </div>
                  {attempt.test?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {attempt.test.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(attempt.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
