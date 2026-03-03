import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { ArrowLeft, Target, Clock, FileText, Award } from 'lucide-react';

export default function AdminUserReport() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getUserReport(userId)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">User not found.</p>
        <Link to="/admin/users" className="text-primary-600 mt-2 inline-block">
          ← Back to users
        </Link>
      </div>
    );
  }

  const { user, summary, topicAnalysis, progressOverTime, recentAttempts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-700">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Tests Taken" value={summary.totalAttempts} color="blue" />
        <StatCard icon={Target} label="Avg Accuracy" value={`${summary.averageAccuracy}%`} color="green" />
        <StatCard icon={Award} label="Tests Created" value={summary.testsCreated} color="purple" />
        <StatCard icon={Clock} label="Admin Tests Done" value={summary.adminTestsCompleted} color="orange" />
      </div>

      {/* Progress Chart */}
      {progressOverTime.length > 1 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Accuracy']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Topic Performance */}
      {topicAnalysis.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topic Performance</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, topicAnalysis.length * 40)}>
            <BarChart data={topicAnalysis} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
              <Bar dataKey="accuracy" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          <div className="space-y-3">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {attempt.test?.title || 'Deleted Test'}
                    {attempt.test?.isAdminTest && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(attempt.createdAt).toLocaleDateString()} · {attempt.scores?.correct}/{attempt.scores?.total} correct
                  </p>
                </div>
                <span
                  className={`text-lg font-bold ${
                    attempt.scores?.percentage >= 70
                      ? 'text-green-600'
                      : attempt.scores?.percentage >= 40
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {attempt.scores?.percentage || 0}%
                </span>
              </div>
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
