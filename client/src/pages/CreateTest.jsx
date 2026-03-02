import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import {
  Upload,
  BookOpen,
  Sparkles,
  X,
  Plus,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'coding', label: 'Coding Questions' },
];

const BLOOMS_LEVELS = [
  { value: 'remember', label: 'Remember' },
  { value: 'understand', label: 'Understand' },
  { value: 'apply', label: 'Apply' },
  { value: 'analyze', label: 'Analyze' },
  { value: 'evaluate', label: 'Evaluate' },
  { value: 'create', label: 'Create' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

export default function CreateTest() {
  const navigate = useNavigate();
  const [generationType, setGenerationType] = useState('topic'); // 'document' or 'topic'
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState(['mcq']);
  const [bloomsLevels, setBloomsLevels] = useState([]);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [customInstructions, setCustomInstructions] = useState('');

  // Topic-based
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [topicWeightage, setTopicWeightage] = useState([]);

  // Document-based
  const [file, setFile] = useState(null);

  const handleAddTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setTopicWeightage([
        ...topicWeightage,
        { topic: trimmed, percentage: Math.floor(100 / (topics.length + 1)) },
      ]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (index) => {
    setTopics(topics.filter((_, i) => i !== index));
    setTopicWeightage(topicWeightage.filter((_, i) => i !== index));
  };

  const handleWeightageChange = (index, value) => {
    const updated = [...topicWeightage];
    updated[index].percentage = parseInt(value) || 0;
    setTopicWeightage(updated);
  };

  const toggleQuestionType = (type) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBloomsLevel = (level) => {
    setBloomsLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/msword',
      ];
      if (!allowed.includes(selected.type)) {
        toast.error('Only PDF, DOCX, DOC, and TXT files are supported.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File must be under 10MB.');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (questionTypes.length === 0) {
      toast.error('Select at least one question type.');
      return;
    }

    if (generationType === 'topic' && topics.length === 0) {
      toast.error('Add at least one topic.');
      return;
    }

    if (generationType === 'document' && !file) {
      toast.error('Please upload a document.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title || `AI Test - ${new Date().toLocaleDateString()}`);
      formData.append('description', description);
      formData.append('generationType', generationType);
      formData.append('totalQuestions', totalQuestions);
      formData.append('difficulty', difficulty);
      formData.append('questionTypes', JSON.stringify(questionTypes));
      formData.append('bloomsLevels', JSON.stringify(bloomsLevels));
      formData.append('timeLimitMinutes', timeLimitMinutes);
      formData.append('customInstructions', customInstructions);

      if (generationType === 'topic') {
        formData.append('topics', JSON.stringify(topics));
        formData.append('topicWeightage', JSON.stringify(topicWeightage));
      }

      if (generationType === 'document' && file) {
        formData.append('document', file);
      }

      const res = await testAPI.generate(formData);
      toast.success('Test generated successfully!');
      navigate(`/test/${res.data.test.id}/take`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Test</h1>
        <p className="text-gray-500 mt-1">Generate AI-powered tests from documents or topics</p>
      </div>

      {/* Generation Type Toggle */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Generation Method
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGenerationType('topic')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              generationType === 'topic'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <BookOpen
              className={`w-6 h-6 mb-2 ${
                generationType === 'topic' ? 'text-primary-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900">From Topics</h3>
            <p className="text-xs text-gray-500 mt-1">Enter topics and let AI generate questions</p>
          </button>

          <button
            type="button"
            onClick={() => setGenerationType('document')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              generationType === 'document'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload
              className={`w-6 h-6 mb-2 ${
                generationType === 'document' ? 'text-primary-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900">From Document</h3>
            <p className="text-xs text-gray-500 mt-1">Upload PDF, DOCX, or TXT files</p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Test Details
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Test Title (optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Java OOP Concepts Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Brief description of the test..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Topic Input (for topic-based) */}
        {generationType === 'topic' && (
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Topics
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Java Multithreading"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
              />
              <button type="button" onClick={handleAddTopic} className="btn-secondary shrink-0">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {topics.length > 0 && (
              <div className="space-y-2">
                {topics.map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <span className="flex-1 text-sm font-medium text-gray-900">{topic}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        value={topicWeightage[i]?.percentage || 0}
                        onChange={(e) => handleWeightageChange(i, e.target.value)}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Document Upload (for document-based) */}
        {generationType === 'document' && (
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Upload Document
            </h2>
            {!file ? (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="text-primary-600 font-medium">Click to upload</span> or drag &
                  drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, DOC, TXT (max 10MB)</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <FileText className="w-6 h-6 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Test Configuration */}
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="100"
                className="input-field"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 10)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Difficulty Level
              </label>
              <select
                className="input-field"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Time Limit (mins)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                className="input-field"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Types</label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((qt) => (
                <button
                  key={qt.value}
                  type="button"
                  onClick={() => toggleQuestionType(qt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    questionTypes.includes(qt.value)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {questionTypes.includes(qt.value) && <CheckCircle className="w-3.5 h-3.5 inline mr-1" />}
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bloom's Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bloom&apos;s Taxonomy Levels{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {BLOOMS_LEVELS.map((bl) => (
                <button
                  key={bl.value}
                  type="button"
                  onClick={() => toggleBloomsLevel(bl.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    bloomsLevels.includes(bl.value)
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {bl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional Instructions{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g., Focus on chapters 2 and 3, include real-world scenarios..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Test with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Test
            </>
          )}
        </button>
      </form>
    </div>
  );
}
