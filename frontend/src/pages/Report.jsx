import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import Navbar from '../components/Navbar';

// ─── Score Ring SVG Component ────────────────────────────────
function ScoreRing({ score, label, size = 80, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = score >= 8 ? '#16a34a' : score >= 6 ? '#2563eb' : score >= 4 ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}>
        <span className="text-lg font-bold" style={{ color }}>{score?.toFixed(1) || '0'}</span>
      </div>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
}

// ─── Priority Badge ──────────────────────────────────────────
function PriorityBadge({ priority }) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      const res = await interviewAPI.getReport(sessionId);
      setReport(res.data.session);
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
        <div className="flex flex-col items-center justify-center py-32">
          <svg className="animate-spin w-10 h-10 text-blue-500 mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <p className="text-gray-500">Loading your AI-powered report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="bg-white rounded-2xl p-8 border border-red-200 text-center max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { scores, questions, answers, category, difficulty, totalQuestions, totalAnswered } = report;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
            <p className="text-gray-500 text-sm mt-1">
              <span className="capitalize">{category}</span> · {difficulty} · {totalAnswered || answers?.length || 0}/{totalQuestions} questions answered
              {report.completedAt && (
                <> · {new Date(report.completedAt).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition">
            ← Dashboard
          </button>
        </div>

        {/* ═══ Score Cards ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Overall', score: scores?.overallScore, icon: '🎯' },
            { label: 'Communication', score: scores?.communicationScore, icon: '💬' },
            { label: 'Confidence', score: scores?.confidenceScore, icon: '💪' },
            { label: 'Technical', score: scores?.technicalScore, icon: '🧠' },
          ].map((item, i) => {
            const s = item.score || 0;
            const color = s >= 8 ? 'text-green-600 bg-green-50 border-green-200' :
                          s >= 6 ? 'text-blue-600 bg-blue-50 border-blue-200' :
                          s >= 4 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                   'text-red-600 bg-red-50 border-red-200';
            return (
              <div key={i} className={`rounded-2xl p-5 border text-center ${color}`}>
                <span className="text-2xl">{item.icon}</span>
                <p className="text-3xl font-bold mt-2">{s.toFixed(1)}</p>
                <p className="text-xs font-medium opacity-75 mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* ═══ Overall AI Feedback ═══ */}
        {scores?.overallFeedback && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              AI Analysis
            </h2>
            <p className="text-gray-700 leading-relaxed">{scores.overallFeedback}</p>
          </div>
        )}

        {/* ═══ Strengths & Improvements ═══ */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Strengths
            </h3>
            {scores?.strengths?.length > 0 ? (
              <ul className="space-y-2.5">
                {scores.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No strengths identified</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              Areas to Improve
            </h3>
            {scores?.improvements?.length > 0 ? (
              <ul className="space-y-2.5">
                {scores.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No areas identified</p>
            )}
          </div>
        </div>

        {/* ═══ AI-Powered Improvement Suggestions ═══ */}
        {scores?.aiSuggestions?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              AI Improvement Suggestions
              <span className="ml-auto text-xs text-gray-400 font-normal">Powered by Gemini AI</span>
            </h2>

            <div className="space-y-3">
              {scores.aiSuggestions.map((suggestion, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                        <PriorityBadge priority={suggestion.priority} />
                        {suggestion.category && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full capitalize">
                            {suggestion.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{suggestion.description}</p>
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      {suggestion.priority === 'high' && (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                      {suggestion.priority === 'medium' && (
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {suggestion.priority === 'low' && (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Question-by-Question Breakdown ═══ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Question Breakdown
          </h2>

          <div className="space-y-2">
            {questions?.map((q, i) => {
              const answer = answers?.[i];
              const qScore = scores?.questionScores?.find(qs => qs.questionIndex === i);
              const isExpanded = expandedQ === i;

              return (
                <div key={i}
                  className={`border rounded-xl transition-all ${isExpanded ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                  {/* Question header - clickable */}
                  <button onClick={() => setExpandedQ(isExpanded ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-800 truncate">{q.text}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      {qScore && (
                        <span className={`text-sm font-bold ${
                          (qScore.overall || 0) >= 7 ? 'text-green-600' :
                          (qScore.overall || 0) >= 5 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {(qScore.overall || 0).toFixed(1)}
                        </span>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                      {/* Your answer */}
                      <div className="mt-3 mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Your Answer:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                          {answer?.transcript || <em className="text-gray-400">No answer recorded</em>}
                        </p>
                        {answer?.duration > 0 && (
                          <p className="text-xs text-gray-400 mt-1">Duration: {Math.floor(answer.duration / 60)}:{(answer.duration % 60).toString().padStart(2, '0')}</p>
                        )}
                      </div>

                      {/* Per-question scores */}
                      {qScore && (
                        <>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: 'Communication', val: qScore.communication },
                              { label: 'Confidence', val: qScore.confidence },
                              { label: 'Technical', val: qScore.technical },
                            ].map((s, j) => (
                              <div key={j} className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                                <p className={`text-lg font-bold ${
                                  (s.val || 0) >= 7 ? 'text-green-600' :
                                  (s.val || 0) >= 5 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {(s.val || 0).toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-400">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {qScore.feedback && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                              <p className="text-xs font-medium text-indigo-700 mb-1">AI Feedback:</p>
                              <p className="text-sm text-indigo-800 leading-relaxed">{qScore.feedback}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ Action buttons ═══ */}
        <div className="flex flex-wrap gap-3 justify-center pb-8">
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Practice Again
          </button>
        </div>
      </main>
    </div>
  );
}
