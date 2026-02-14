import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';

const CATEGORIES = [
  { value: 'mixed', label: 'Mixed', icon: '🎯', desc: 'All categories combined' },
  { value: 'technical', label: 'Technical', icon: '💻', desc: 'Coding & engineering' },
  { value: 'behavioral', label: 'Behavioral', icon: '🤝', desc: 'Soft skills & teamwork' },
  { value: 'system-design', label: 'System Design', icon: '🏗️', desc: 'Architecture & scaling' },
  { value: 'general', label: 'General', icon: '💼', desc: 'Career & motivation' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  { value: 'hard', label: 'Hard', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
];

function ScoreCard({ label, value, color }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value || '—'}</p>
    </div>
  );
}

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

  useEffect(() => {
    loadData();
  }, []);

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
      // Save first question data for the InterviewRoom to pick up
      sessionStorage.setItem(`interview_${sessionId}`, JSON.stringify(res.data));
      navigate(`/interview/${sessionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-blue-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="text-blue-400">{user.name || 'User'}</span>
          </h1>
          <p className="text-slate-400 mt-1">Ready for your next interview practice?</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <ScoreCard label="Sessions" value={stats.completedSessions} color="text-white" />
            <ScoreCard label="Avg Score" value={stats.averageScores?.overall?.toFixed(1)} color={getScoreColor(stats.averageScores?.overall)} />
            <ScoreCard label="Communication" value={stats.averageScores?.communication?.toFixed(1)} color={getScoreColor(stats.averageScores?.communication)} />
            <ScoreCard label="Confidence" value={stats.averageScores?.confidence?.toFixed(1)} color={getScoreColor(stats.averageScores?.confidence)} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Start Interview Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Interview
              </h2>

              {/* Category Selection */}
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Category</label>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setCategory(cat.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left
                        ${category === cat.value
                          ? 'border-blue-500/50 bg-blue-500/10 text-white'
                          : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/10'
                        }`}>
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{cat.label}</p>
                        <p className="text-xs text-slate-500">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d.value} onClick={() => setDifficulty(d.value)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition
                        ${difficulty === d.value ? d.color : 'border-white/5 text-slate-400 hover:border-white/10'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions count */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">Questions: {totalQuestions}</label>
                <input type="range" min="3" max="10" value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>3</span><span>10</span>
                </div>
              </div>

              <button onClick={handleStart} disabled={starting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                {starting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Start Interview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Interview History</h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-slate-400">No interviews yet</p>
                  <p className="text-slate-500 text-sm mt-1">Start your first interview to see results here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(session => (
                    <button key={session._id} onClick={() => session.completed && navigate(`/report/${session._id}`)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition text-left">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                          ${session.completed ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                          {session.completed ? '✅' : '⏳'}
                        </div>
                        <div>
                          <p className="text-white font-medium capitalize">{session.category} Interview</p>
                          <p className="text-slate-500 text-sm">
                            {session.totalQuestions} questions • {session.difficulty} •{' '}
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {session.completed && session.scores?.overallScore != null && (
                        <div className={`text-2xl font-bold ${getScoreColor(session.scores.overallScore)}`}>
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
