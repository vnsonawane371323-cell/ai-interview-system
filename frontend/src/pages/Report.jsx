import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';

function ScoreRing({ score, label, size = 100 }) {
  const percentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (s) => {
    if (s >= 8) return { stroke: '#22c55e', text: 'text-green-400', bg: 'text-green-950' };
    if (s >= 6) return { stroke: '#3b82f6', text: 'text-blue-400', bg: 'text-blue-950' };
    if (s >= 4) return { stroke: '#eab308', text: 'text-yellow-400', bg: 'text-yellow-950' };
    return { stroke: '#ef4444', text: 'text-red-400', bg: 'text-red-950' };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color.stroke} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${color.text}`}>{score.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-2 text-center">{label}</p>
    </div>
  );
}

function QuestionResult({ index, questionText, answer, score, feedback, category }) {
  const [expanded, setExpanded] = useState(false);

  const getScoreBadge = (s) => {
    if (!s && s !== 0) return { color: 'bg-slate-700 text-slate-300', label: 'N/A' };
    if (s >= 8) return { color: 'bg-green-500/10 text-green-400 border border-green-500/20', label: s.toFixed(1) };
    if (s >= 6) return { color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', label: s.toFixed(1) };
    if (s >= 4) return { color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', label: s.toFixed(1) };
    return { color: 'bg-red-500/10 text-red-400 border border-red-500/20', label: s.toFixed(1) };
  };

  const badge = getScoreBadge(score);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{questionText}</p>
            <p className="text-slate-500 text-xs capitalize mt-0.5">{category}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${badge.color}`}>{badge.label}</span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Answer</p>
            <p className="text-slate-300 text-sm leading-relaxed">{answer || 'No response'}</p>
          </div>
          {feedback && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Feedback</p>
              <p className="text-slate-300 text-sm leading-relaxed">{feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      const res = await interviewAPI.getReport(sessionId);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg className="animate-spin w-10 h-10 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const scores = report.scores;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Report</h1>
          <p className="text-slate-400">
            <span className="capitalize">{report.category}</span> interview • {report.difficulty} difficulty •{' '}
            {report.totalAnswered} of {report.totalQuestions} questions answered
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {new Date(report.completedAt || report.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Overall Score */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <ScoreRing score={scores.overallScore} label="Overall Score" size={140} />
            <div className="flex gap-6">
              <ScoreRing score={scores.communicationScore} label="Communication" size={100} />
              <ScoreRing score={scores.confidenceScore} label="Confidence" size={100} />
              <ScoreRing score={scores.technicalScore} label="Technical" size={100} />
            </div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Strengths
            </h3>
            <ul className="space-y-2">
              {scores.strengths?.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {scores.improvements?.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Question Breakdown</h3>
          <div className="space-y-3">
            {report.questions?.map((q, i) => (
              <QuestionResult
                key={i}
                index={i}
                questionText={q.text}
                answer={q.answer}
                score={q.score?.score}
                feedback={q.score?.feedback}
                category={q.category}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-lg shadow-blue-500/25">
            Back to Dashboard
          </button>
          <button onClick={() => { navigate('/dashboard'); setTimeout(() => window.scrollTo(0, 0), 100); }}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition">
            Start New Interview
          </button>
        </div>
      </main>
    </div>
  );
}
