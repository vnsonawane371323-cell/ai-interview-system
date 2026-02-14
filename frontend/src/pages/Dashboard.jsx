import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';

const CATEGORIES = [
  { value: 'mixed', label: 'Mixed', icon: '🎯', desc: 'All categories' },
  { value: 'technical', label: 'Technical', icon: '💻', desc: 'Coding & engineering' },
  { value: 'behavioral', label: 'Behavioral', icon: '🤝', desc: 'Soft skills' },
  { value: 'system-design', label: 'System Design', icon: '🏗️', desc: 'Architecture' },
  { value: 'general', label: 'General', icon: '💼', desc: 'Career topics' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'text-green-700 border-green-300 bg-green-50' },
  { value: 'medium', label: 'Medium', color: 'text-amber-700 border-amber-300 bg-amber-50' },
  { value: 'hard', label: 'Hard', color: 'text-red-700 border-red-300 bg-red-50' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [category, setCategory] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalQuestions, setTotalQuestions] = useState(5);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        interviewAPI.getStats(),
        interviewAPI.getHistory()
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await interviewAPI.start({ category, difficulty, totalQuestions });
      const { sessionId } = res.data;
      sessionStorage.setItem(`interview_${sessionId}`, JSON.stringify(res.data));
      navigate(`/interview/${sessionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'bg-green-50 border-green-200';
    if (score >= 6) return 'bg-blue-50 border-blue-200';
    if (score >= 4) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name || 'User'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Ready for your next interview practice session?</p>
        </div>

        {/* Stats Row */}
        {stats && stats.completedSessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Sessions', value: stats.completedSessions, color: 'text-gray-900' },
              { label: 'Avg Score', value: stats.averageScores?.overall?.toFixed(1), color: getScoreColor(stats.averageScores?.overall) },
              { label: 'Communication', value: stats.averageScores?.communication?.toFixed(1), color: getScoreColor(stats.averageScores?.communication) },
              { label: 'Confidence', value: stats.averageScores?.confidence?.toFixed(1), color: getScoreColor(stats.averageScores?.confidence) },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value || '—'}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Start Interview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                New Interview
              </h2>

              {/* Category */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <div className="space-y-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setCategory(cat.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition text-left text-sm
                        ${category === cat.value
                          ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                      <span className="text-lg">{cat.icon}</span>
                      <div>
                        <p className="font-medium">{cat.label}</p>
                        <p className="text-xs text-gray-500">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d.value} onClick={() => setDifficulty(d.value)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition
                        ${difficulty === d.value
                          ? d.color + ' ring-1 ring-current'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Questions: <span className="text-blue-600 font-bold">{totalQuestions}</span>
                </label>
                <input type="range" min="3" max="10" value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>3</span><span>10</span>
                </div>
              </div>

              <button onClick={handleStart} disabled={starting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                {starting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    Start Interview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview History</h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No interviews yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start your first interview to see results here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(session => (
                    <button key={session._id}
                      onClick={() => session.completed && navigate(`/report/${session._id}`)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition text-left group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm
                          ${session.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {session.completed ? '✓' : '⏳'}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium capitalize text-sm">{session.category} Interview</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {session.totalQuestions} questions · {session.difficulty} ·{' '}
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {session.completed && session.scores?.overallScore != null && (
                        <div className={`px-3 py-1.5 rounded-lg border font-bold text-lg ${getScoreBg(session.scores.overallScore)} ${getScoreColor(session.scores.overallScore)}`}>
                          {session.scores.overallScore.toFixed(1)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
