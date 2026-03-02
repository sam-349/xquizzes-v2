import { useState, useEffect } from 'react';
import { attemptAPI } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await attemptAPI.getAnalytics();
      setData(res.data);
    } catch (error) {
      console.error('Fetch analytics error:', error);
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

  if (!data || data.overview.totalTests === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 card">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Analytics Yet</h2>
        <p className="text-gray-500">
          Complete at least one test to see your performance analytics here.
        </p>
      </div>
    );
  }

  const { overview, topicAnalysis, difficultyAnalysis, progressOverTime, strengthsAndWeaknesses } =
    data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-500 mt-1">Track your progress and identify areas for improvement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Target} label="Tests Taken" value={overview.totalTests} color="blue" />
        <StatCard
          icon={TrendingUp}
          label="Avg. Accuracy"
          value={`${overview.averageAccuracy}%`}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          label="Total Correct"
          value={`${overview.totalCorrect}/${overview.totalQuestions}`}
          color="purple"
        />
        <StatCard
          icon={Clock}
          label="Avg. Time"
          value={`${Math.floor(overview.averageTime / 60)}m`}
          color="orange"
        />
        <StatCard
          icon={Award}
          label="Questions"
          value={overview.totalQuestions}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h2>
          {progressOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip
                  labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  formatter={(value) => [`${value}%`, 'Accuracy']}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Not enough data yet</p>
          )}
        </div>

        {/* Topic-wise Accuracy */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accuracy by Topic</h2>
          {topicAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topicAnalysis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis
                  dataKey="topic"
                  type="category"
                  width={100}
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                  {topicAnalysis.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.accuracy >= 70
                          ? '#22c55e'
                          : entry.accuracy >= 40
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Not enough data yet</p>
          )}
        </div>
      </div>

      {/* Difficulty Breakdown & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Pie Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accuracy by Difficulty</h2>
          {difficultyAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={difficultyAnalysis}
                  dataKey="accuracy"
                  nameKey="difficulty"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ difficulty, accuracy }) => `${difficulty}: ${accuracy}%`}
                >
                  {difficultyAnalysis.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Not enough data yet</p>
          )}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Strengths & Weaknesses</h2>

          {/* Strengths */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Strong Areas
            </h3>
            {strengthsAndWeaknesses.strengths.length > 0 ? (
              <div className="space-y-2">
                {strengthsAndWeaknesses.strengths.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-900">{s.topic}</span>
                    <span className="text-sm font-bold text-green-700">{s.accuracy}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Keep practicing to build strengths!</p>
            )}
          </div>

          {/* Weaknesses */}
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Areas to Improve
            </h3>
            {strengthsAndWeaknesses.weaknesses.length > 0 ? (
              <div className="space-y-2">
                {strengthsAndWeaknesses.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-900">{w.topic}</span>
                    <span className="text-sm font-bold text-red-700">{w.accuracy}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Great job! No weak areas detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Topic Details Table */}
      {topicAnalysis.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Topic Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Topic</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Total Qs</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Correct</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Accuracy</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Progress</th>
                </tr>
              </thead>
              <tbody>
                {topicAnalysis.map((topic, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{topic.topic}</td>
                    <td className="text-center py-3 px-4 text-gray-600">{topic.total}</td>
                    <td className="text-center py-3 px-4 text-gray-600">{topic.correct}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`font-bold ${
                          topic.accuracy >= 70
                            ? 'text-green-600'
                            : topic.accuracy >= 40
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {topic.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            topic.accuracy >= 70
                              ? 'bg-green-500'
                              : topic.accuracy >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
