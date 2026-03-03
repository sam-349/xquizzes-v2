import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { Users, FileText, ClipboardList, Target, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of all users and test activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="blue" />
        <StatCard icon={FileText} label="Total Tests" value={stats?.totalTests || 0} color="green" />
        <StatCard icon={ClipboardList} label="Total Attempts" value={stats?.totalAttempts || 0} color="purple" />
        <StatCard icon={Target} label="Avg Accuracy" value={`${stats?.avgAccuracy || 0}%`} color="orange" />
        <StatCard icon={TrendingUp} label="Admin Tests" value={stats?.adminTests || 0} color="blue" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/create-test"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Create & Assign Test</h3>
            <p className="text-sm text-gray-500">Generate AI test and assign to users</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link
          to="/admin/users"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">View Users</h3>
            <p className="text-sm text-gray-500">Browse all users and their reports</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </Link>
      </div>

      {/* Recent Users */}
      {stats?.recentUsers?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <Link
                key={user._id}
                to={`/admin/users/${user._id}/report`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{user.stats?.averageAccuracy || 0}%</p>
                  <p className="text-xs text-gray-500">{user.stats?.totalTestsTaken || 0} tests</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
