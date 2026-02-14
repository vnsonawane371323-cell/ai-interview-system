import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';

function ScoreRing({ score, label, size = 100, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = (score / 10) * circumference;

  const getColor = (s) => {
    if (s >= 8) return { stroke: '#16a34a', text: 'text-green-600', bg: 'bg-green-50' };
    if (s >= 6) return { stroke: '#2563eb', text: 'text-blue-600', bg: 'bg-blue-50' };
    if (s >= 4) return { stroke: '#d97706', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { stroke: '#dc2626', text: 'text-red-600', bg: 'bg-red-50' };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color.stroke} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={circumference - fillPercent}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${color.text}`}>{score.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2 font-medium">{label}</p>
    </div>
  );
}

function QuestionResult({ question, answer, index, score }) {
  const [open, setOpen] = useState(false);

  const getScoreBadge = (s) => {
    if (s >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 6) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s >= 4) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm font-bold">{index + 1}</span>
          </div>
          <p className="text-gray-800 text-sm font-medium line-clamp-1">{question.text}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {score != null && (
            <span className={`px-2.5 py-1 rounded-lg border text-sm font-bold ${getScoreBadge(score)}`}>
              {score.toFixed(1)}
            </span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Your Answer</p>
              <p className="text-gray-700 text-sm leading-relaxed bg-white p-3 rounded-lg border border-gray-100">
                {answer?.transcript || <span className="italic text-gray-400">No answer provided</span>}
              </p>
            </div>
            {answer?.duration != null && (
              <p className="text-xs text-gray-400">Duration: {Math.round(answer.duration)}s</p>
            )}
          </div>
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-32">
          <div className="text-center">
            <svg className="animate-spin w-10 h-10 text-blue-500 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-gray-500 mt-4">Analyzing your performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-32">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <h2 className="text-gray-900 font-semibold text-lg">{error}</h2>
            <button onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { session, report: rpt } = report;
  const scores = session.scores || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {session.category} Interview · {session.difficulty} · {session.totalQuestions} questions
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition border border-gray-200">
            ← Dashboard
          </button>
        </div>

        {/* Score Cards */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            <ScoreRing score={scores.overallScore || 0} label="Overall" size={110} strokeWidth={10} />
            <ScoreRing score={scores.communicationScore || 0} label="Communication" />
            <ScoreRing score={scores.confidenceScore || 0} label="Confidence" />
            <ScoreRing score={scores.technicalScore || 0} label="Technical" />
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Strengths
            </h3>
            {scores.strengths?.length > 0 ? (
              <ul className="space-y-2">
                {scores.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">Complete more questions to see strengths</p>
            )}
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              Areas to Improve
            </h3>
            {scores.improvements?.length > 0 ? (
              <ul className="space-y-2">
                {scores.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">Great job! No major improvements identified</p>
            )}
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-gray-900 font-semibold mb-4">Question Breakdown</h3>
          <div className="space-y-2">
            {session.questions?.map((q, i) => (
              <QuestionResult
                key={i}
                question={q}
                answer={session.answers?.[i]}
                index={i}
                score={scores.questionScores?.[i]?.overall}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pb-8">
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm">
            Start New Interview
          </button>
        </div>
      </main>
    </div>
  );
}
