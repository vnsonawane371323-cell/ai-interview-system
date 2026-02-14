import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';

const Interview = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = async () => {
    try {
      setGenerating(true);
      setError('');
      const response = await interviewAPI.generateQuestion({
        category,
        difficulty,
      });
      setQuestion(response.data.data.question);
    } catch (err) {
      setError('Failed to generate question. Using default.');
      setQuestion('Tell me about a challenging project you worked on and how you overcame obstacles.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    if (answer.trim().length < 50) {
      setError('Please provide a more detailed answer (at least 50 characters)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await interviewAPI.create({
        question,
        answer: answer.trim(),
        category,
        difficulty,
      });

      setResult(response.data.data);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewInterview = () => {
    setAnswer('');
    setSubmitted(false);
    setResult(null);
    setError('');
    generateQuestion();
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (!score) return 'Pending';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!submitted ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mock Interview
              </h1>
              <p className="text-lg text-gray-600">
                Answer the question below to receive AI-powered feedback
              </p>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Interview Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="system-design">System Design</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <button
                onClick={generateQuestion}
                disabled={generating}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
              >
                {generating ? 'Generating...' : '🔄 Generate New Question'}
              </button>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 mb-6">
              {generating ? (
                <div className="text-center text-white">
                  <svg
                    className="animate-spin h-8 w-8 mx-auto mb-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p>Generating question...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xs px-3 py-1 bg-white bg-opacity-20 text-white rounded-full">
                      {category}
                    </span>
                    <span className="text-xs px-3 py-1 bg-white bg-opacity-20 text-white rounded-full">
                      {difficulty}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Interview Question
                  </h2>
                  <p className="text-lg text-white leading-relaxed">
                    {question}
                  </p>
                </>
              )}
            </div>

            {/* Answer Form */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setError('');
                  }}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your detailed answer here... (minimum 50 characters)"
                  disabled={loading}
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    {answer.length} characters
                  </span>
                  {answer.length < 50 && answer.length > 0 && (
                    <span className="text-sm text-yellow-600">
                      Need {50 - answer.length} more characters
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || !answer.trim() || answer.length < 50}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Evaluating with AI...
                    </span>
                  ) : (
                    'Submit & Get Feedback'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Complete! 🎉
              </h1>
              <p className="text-lg text-gray-600">
                Here's your AI-powered feedback
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6 text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Your Score
              </p>
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(result?.score)}`}>
                {result?.score || 'N/A'}
                {result?.score && <span className="text-2xl">/100</span>}
              </div>
              <p className={`text-lg font-semibold ${getScoreColor(result?.score)}`}>
                {getScoreLabel(result?.score)}
              </p>
            </div>

            {/* Question Review */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Question
              </h3>
              <p className="text-gray-900">{result?.question}</p>
            </div>

            {/* Answer Review */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Your Answer
              </h3>
              <p className="text-gray-900 whitespace-pre-wrap">{result?.answer}</p>
            </div>

            {/* AI Feedback */}
            <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    AI Feedback
                  </h3>
                  <p className="text-blue-900 leading-relaxed whitespace-pre-wrap">
                    {result?.aiFeedback || 'Feedback is being generated...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleNewInterview}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-[1.02]"
              >
                Start Another Interview
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Interview;
