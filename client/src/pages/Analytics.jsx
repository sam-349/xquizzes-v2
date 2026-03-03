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
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  mixed: '#8b5cf6',
};

// Custom tick for vertical bar chart Y-axis to truncate long topic names
const TruncatedTick = ({ x, y, payload }) => {
  const maxLen = 18;
  const text =
    payload.value.length > maxLen
      ? payload.value.substring(0, maxLen) + '…'
      : payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{payload.value}</title>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#6b7280"
        fontSize={12}
      >
        {text}
      </text>
    </g>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topicPage, setTopicPage] = useState(1);
  const TOPICS_PER_PAGE = 5;

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
            <ResponsiveContainer width="100%" height={Math.max(280, topicAnalysis.length * 40)}>
              <BarChart data={topicAnalysis} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} fontSize={12} unit="%" />
                <YAxis
                  dataKey="topic"
                  type="category"
                  width={140}
                  tick={<TruncatedTick />}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Accuracy']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={20}>
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
        {/* Difficulty Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accuracy by Difficulty</h2>
          {difficultyAnalysis.length > 0 ? (
            <div className="space-y-5 py-4">
              {difficultyAnalysis.map((d) => {
                const color =
                  DIFFICULTY_COLORS[d.difficulty.toLowerCase()] || '#3b82f6';
                return (
                  <div key={d.difficulty}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {d.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {d.correct}/{d.total} correct
                        </span>
                        <span className="text-sm font-bold" style={{ color }}>
                          {d.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${d.accuracy}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Topic Breakdown</h2>
            <span className="text-xs text-gray-500">
              {topicAnalysis.length} topic{topicAnalysis.length !== 1 ? 's' : ''}
            </span>
          </div>
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
                {topicAnalysis
                  .slice((topicPage - 1) * TOPICS_PER_PAGE, topicPage * TOPICS_PER_PAGE)
                  .map((topic, i) => (
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

          {/* Pagination Controls */}
          {topicAnalysis.length > TOPICS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {(topicPage - 1) * TOPICS_PER_PAGE + 1}–
                {Math.min(topicPage * TOPICS_PER_PAGE, topicAnalysis.length)} of{' '}
                {topicAnalysis.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTopicPage((p) => Math.max(1, p - 1))}
                  disabled={topicPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {topicPage} / {Math.ceil(topicAnalysis.length / TOPICS_PER_PAGE)}
                </span>
                <button
                  onClick={() =>
                    setTopicPage((p) =>
                      Math.min(Math.ceil(topicAnalysis.length / TOPICS_PER_PAGE), p + 1)
                    )
                  }
                  disabled={topicPage >= Math.ceil(topicAnalysis.length / TOPICS_PER_PAGE)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
