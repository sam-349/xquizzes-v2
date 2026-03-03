import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { FileText, Users, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchTests();
  }, [page]);

  const fetchTests = async () => {
    try {
      const res = await adminAPI.getTests({ page, limit: 10 });
      setTests(res.data.tests);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Fetch admin tests error:', error);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Tests</h1>
          <p className="text-gray-500 mt-1">{pagination?.total || 0} tests created by admin</p>
        </div>
        <Link to="/admin/create-test" className="btn-primary self-start">
          + Create & Assign Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No admin tests created yet.</p>
          <Link to="/admin/create-test" className="text-primary-600 text-sm mt-2 inline-block">
            Create your first test →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{test.title}</h3>
                  {test.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{test.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {test.config?.totalQuestions || 0} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {test.config?.timeLimitMinutes || 30} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {test.assignedCount} assigned
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {test.completedCount}/{test.assignedCount} completed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      test.config?.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : test.config?.difficulty === 'hard'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {test.config?.difficulty}
                  </span>
                </div>
              </div>

              {/* Assigned users preview */}
              {test.assignedTo?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Assigned to:</p>
                  <div className="flex flex-wrap gap-2">
                    {test.assignedTo.slice(0, 5).map((u) => (
                      <span
                        key={u._id}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {u.name || u.email}
                      </span>
                    ))}
                    {test.assignedTo.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        +{test.assignedTo.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
