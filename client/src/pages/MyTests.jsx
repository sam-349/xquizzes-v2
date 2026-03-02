import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testAPI } from '../services/api';
import { FileText, Trash2, Play, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchTests();
  }, [page, search]);

  const fetchTests = async () => {
    try {
      const res = await testAPI.getMyTests({ page, limit: 10, search });
      setTests(res.data.tests);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Fetch tests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test? This cannot be undone.')) return;
    try {
      await testAPI.delete(id);
      setTests(tests.filter((t) => t._id !== id));
      toast.success('Test deleted.');
    } catch {
      toast.error('Failed to delete test.');
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
          <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
          <p className="text-gray-500 mt-1">{pagination?.total || 0} tests created</p>
        </div>
        <Link to="/create-test" className="btn-primary self-start">
          + Create New Test
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {tests.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tests found. Create your first test!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{test.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-500">
                      {test.config?.totalQuestions} questions
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className={`badge-${test.config?.difficulty || 'medium'}`}>
                      {test.config?.difficulty}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {test.config?.timeLimitMinutes}m
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {test.generationType === 'document' ? '📄 Document' : '💡 Topic'}
                    </span>
                  </div>
                  {test.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {test.tags.slice(0, 4).map((tag, i) => (
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
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/test/${test._id}/take`}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Take Test
                  </Link>
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
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
