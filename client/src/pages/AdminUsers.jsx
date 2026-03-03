import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { Search, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ page, limit: 15, search });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Fetch users error:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-500 mt-1">{pagination?.total || 0} registered users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field pl-10"
        />
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Tests Taken</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Tests Created</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Avg Accuracy</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Joined</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">
                    {user.stats?.totalTestsTaken || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">
                    {user.stats?.testsCreated || 0}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`font-bold ${
                        (user.stats?.averageAccuracy || 0) >= 70
                          ? 'text-green-600'
                          : (user.stats?.averageAccuracy || 0) >= 40
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {user.stats?.averageAccuracy || 0}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-center py-3 px-4">
                    <Link
                      to={`/admin/users/${user._id}/report`}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
                    >
                      Report <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} users)
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
