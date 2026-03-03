import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  BookOpen, Upload, Plus, X, Loader2, Users, Search, CheckSquare, Square,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Test config
  const [generationType, setGenerationType] = useState('topic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState(['mcq']);
  const [bloomsLevels, setBloomsLevels] = useState([]);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [deadline, setDeadline] = useState('');

  // User assignment
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ limit: 200 });
      setUsers(res.data.users);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const addTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setTopicInput('');
    }
  };

  const toggleQType = (type) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBlooms = (level) => {
    setBloomsLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u._id));
    }
    setSelectAll(!selectAll);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (generationType === 'topic' && topics.length === 0) {
      toast.error('Add at least one topic.');
      return;
    }
    if (generationType === 'document' && !file) {
      toast.error('Upload a document.');
      return;
    }
    if (questionTypes.length === 0) {
      toast.error('Select at least one question type.');
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error('Select at least one user to assign.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title || `Admin Test - ${new Date().toLocaleDateString()}`);
      formData.append('description', description);
      formData.append('generationType', generationType);
      formData.append('totalQuestions', totalQuestions);
      formData.append('difficulty', difficulty);
      formData.append('questionTypes', JSON.stringify(questionTypes));
      formData.append('bloomsLevels', JSON.stringify(bloomsLevels));
      formData.append('timeLimitMinutes', timeLimitMinutes);
      formData.append('assignedTo', JSON.stringify(selectedUsers));
      if (deadline) formData.append('deadline', deadline);

      if (generationType === 'topic') {
        formData.append('topics', JSON.stringify(topics));
      }
      if (generationType === 'document' && file) {
        formData.append('document', file);
      }

      await adminAPI.generateTest(formData);
      toast.success(`Test created and assigned to ${selectedUsers.length} user(s)!`);
      navigate('/admin/tests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create & Assign Test</h1>
        <p className="text-gray-500 mt-1">Generate an AI test and assign it to users</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Test Details</h2>
          <input
            type="text"
            placeholder="Test title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            rows={2}
          />
        </div>

        {/* Generation Type */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Generation Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGenerationType('topic')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                generationType === 'topic' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <BookOpen className={`w-6 h-6 mb-2 ${generationType === 'topic' ? 'text-primary-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">From Topics</h3>
              <p className="text-xs text-gray-500 mt-1">Enter topics for AI generation</p>
            </button>
            <button
              type="button"
              onClick={() => setGenerationType('document')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                generationType === 'document' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Upload className={`w-6 h-6 mb-2 ${generationType === 'document' ? 'text-primary-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">From Document</h3>
              <p className="text-xs text-gray-500 mt-1">Upload PDF, DOCX, or TXT</p>
            </button>
          </div>
        </div>

        {/* Topics or File */}
        {generationType === 'topic' ? (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Topics</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add a topic..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                className="input-field flex-1"
              />
              <button type="button" onClick={addTopic} className="btn-primary px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <span key={t} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setTopics(topics.filter((x) => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Upload Document</h2>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="input-field"
            />
          </div>
        )}

        {/* Config */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Questions</label>
              <input type="number" min={1} max={50} value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field mt-1">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Time Limit (min)</label>
              <input type="number" min={5} max={180} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} className="input-field mt-1" />
            </div>
          </div>

          {/* Question Types */}
          <div>
            <label className="text-xs font-medium text-gray-600">Question Types</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                ['mcq', 'MCQ'],
                ['true_false', 'True/False'],
                ['short_answer', 'Short Answer'],
                ['coding', 'Coding'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggleQType(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    questionTypes.includes(val)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bloom's */}
          <div>
            <label className="text-xs font-medium text-gray-600">Bloom's Levels (optional)</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleBlooms(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${
                    bloomsLevels.includes(level)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs font-medium text-gray-600">Deadline (optional)</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input-field mt-1 max-w-xs" />
          </div>
        </div>

        {/* Assign Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Assign to Users
            </h2>
            <span className="text-xs text-primary-600 font-medium">
              {selectedUsers.length} selected
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="mb-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {loadingUsers ? (
            <div className="text-center py-6 text-gray-400">Loading users...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                  >
                    {selectedUsers.includes(user._id) ? (
                      <CheckSquare
                        className="w-5 h-5 text-primary-600 shrink-0"
                        onClick={() => toggleUser(user._id)}
                      />
                    ) : (
                      <Square
                        className="w-5 h-5 text-gray-300 shrink-0"
                        onClick={() => toggleUser(user._id)}
                      />
                    )}
                    <div className="flex-1 min-w-0" onClick={() => toggleUser(user._id)}>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating & Assigning...
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              Generate & Assign Test
            </>
          )}
        </button>
      </form>
    </div>
  );
}
