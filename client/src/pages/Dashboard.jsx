import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { testAPI, attemptAPI } from '../services/api';
import {
  PlusCircle,
  FileText,
  Target,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import ChatWidget from '../components/ChatWidget';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentTests, setRecentTests] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        testAPI.getMyTests({ limit: 5 }),
        attemptAPI.getMy({ limit: 5 }),
      ]);
      setRecentTests(testsRes.data.tests);
      setRecentAttempts(attemptsRes.data.attempts);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = user?.stats || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}! Here&apos;s your overview.</p>
        </div>
        <Link to="/create-test" className="btn-primary inline-flex items-center gap-2 self-start">
          <PlusCircle className="w-5 h-5" />
          Create New Test
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Tests Created"
          value={stats.testsCreated || 0}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Tests Taken"
          value={stats.totalTestsTaken || 0}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Accuracy"
          value={`${stats.averageAccuracy || 0}%`}
          color="purple"
        />
        <StatCard
          icon={Clock}
          label="Avg. Time"
          value={formatTime(stats.averageTimeTaken || 0)}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/create-test"
          className="card hover:shadow-md transition-shadow group cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
            <PlusCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Generate from Document</h3>
            <p className="text-sm text-gray-500">Upload PDF, DOCX, or TXT and generate a test</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link
          to="/create-test"
          className="card hover:shadow-md transition-shadow group cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Generate from Topics</h3>
            <p className="text-sm text-gray-500">Create tests on any topic using AI knowledge</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tests</h2>
            <Link to="/my-tests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          {recentTests.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No tests created yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTests.map((test) => (
                <Link
                  key={test._id}
                  to={`/test/${test._id}/take`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-primary-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{test.title}</p>
                    <p className="text-xs text-gray-500">
                      {test.questions?.length || test.config?.totalQuestions} questions •{' '}
                      {test.config?.difficulty}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Attempts</h2>
            <Link to="/my-attempts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          {recentAttempts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No attempts yet. Take a test!</p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <Link
                  key={attempt._id}
                  to={`/attempt/${attempt._id}/review`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attempt.test?.title || 'Test'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attempt.correctAnswers}/{attempt.totalQuestions} correct
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics CTA */}
      {stats.totalTestsTaken > 0 && (
        <Link
          to="/analytics"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer"
        >
          <BarChart3 className="w-8 h-8 text-primary-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">View Detailed Analytics</h3>
            <p className="text-sm text-gray-500">
              See your performance trends, weak areas, and improvement over time
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
      )}
      {/* Chat widget (floating) */}
      <ChatWidget userId={user?.id || user?._id} />
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
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
