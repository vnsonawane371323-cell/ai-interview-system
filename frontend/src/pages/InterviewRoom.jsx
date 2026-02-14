import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';

// ─── Speech Recognition helper ──────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Session state
  const [question, setQuestion] = useState(null);       // { text, category, order }
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(0);   // 0-based

  // Recording state
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const interimRef = useRef('');

  // ─── 1. Load session data ──────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem(`interview_${sessionId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setQuestion(data.question);
        setTotalQuestions(data.totalQuestions);
        setCurrentIndex(0);
      } catch {
        setError('Invalid session data');
      }
    } else {
      setError('Session not found. Please start a new interview from the Dashboard.');
    }
  }, [sessionId]);

  // ─── 2. Start webcam ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
          };
        }
        setCameraReady(true);
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera/microphone permission denied. Please allow access and reload.'
            : 'Cannot access camera. Make sure no other app is using it.'
        );
      }
    }
    startCamera();
    return () => {
      mounted = false;
      stopEverything();
    };
  }, []);

  // ─── 3. Timer tick ─────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // ─── Helpers ───────────────────────────────────────────────
  const stopEverything = useCallback(() => {
    // Stop recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    // Stop camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── 4. Start / Stop Recording ────────────────────────────
  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    setTranscript('');
    interimRef.current = '';
    setTimer(0);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interim += t;
        }
      }
      interimRef.current = finalTranscript;
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return; // ignore silence
      if (event.error === 'aborted') return;
    };

    recognition.onend = () => {
      // Auto-restart if still recording (browser may stop after silence)
      if (recognitionRef.current && isRecording) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition. Please check microphone access.');
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    // Use the latest transcript
    if (interimRef.current) {
      setTranscript(interimRef.current.trim());
    }
  }, []);

  // ─── 5. Submit Answer ─────────────────────────────────────
  const handleSubmit = async () => {
    const answer = transcript.trim();
    if (!answer) {
      setError('Please record your answer before submitting. Click the microphone to start.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await interviewAPI.submitAnswer({
        sessionId,
        transcript: answer,
        duration: timer,
      });

      const data = res.data;

      if (data.completed || data.finished) {
        // Session is done — show completion popup
        setShowComplete(true);
        setGeneratingReport(false);
        // Cleanup
        stopEverything();
      } else {
        // Move to next question
        setQuestion(data.nextQuestion);
        setCurrentIndex(data.currentQuestion);
        setTranscript('');
        interimRef.current = '';
        setTimer(0);
        setIsRecording(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 6. Skip Question ────────────────────────────────────
  const handleSkip = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await interviewAPI.submitAnswer({
        sessionId,
        transcript: '(skipped)',
        duration: 0,
      });

      const data = res.data;
      if (data.completed || data.finished) {
        setShowComplete(true);
        stopEverything();
      } else {
        setQuestion(data.nextQuestion);
        setCurrentIndex(data.currentQuestion);
        setTranscript('');
        interimRef.current = '';
        setTimer(0);
        setIsRecording(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to skip question.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 7. Navigate to report ───────────────────────────────
  const goToReport = () => {
    sessionStorage.removeItem(`interview_${sessionId}`);
    navigate(`/report/${sessionId}`);
  };

  // ─── 8. Leave interview ──────────────────────────────────
  const handleLeave = () => {
    if (confirm('Are you sure you want to leave? Your progress will be saved.')) {
      stopEverything();
      navigate('/dashboard');
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  // ── Session Complete Modal ─────────────────────────────────
  if (showComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-md w-full p-8 text-center">
          {/* Animated checkmark */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-2">
            You've answered all {totalQuestions} questions successfully.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Your AI-powered performance report is ready.
          </p>

          <button onClick={goToReport}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Performance Report
          </button>

          <button onClick={() => navigate('/dashboard')}
            className="w-full mt-3 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Error / Loading states ─────────────────────────────────
  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {error ? (
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
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <p className="text-gray-500 text-sm">Loading interview...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={handleLeave}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit
          </button>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              Question {currentIndex + 1}
              <span className="text-gray-400"> / {totalQuestions}</span>
            </span>
            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 text-sm font-mono ${isRecording ? 'text-red-600' : 'text-gray-400'}`}>
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            {formatTime(timer)}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Video + Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Webcam */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full h-full object-cover" />

              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                  <svg className="animate-spin w-8 h-8 mb-3 text-blue-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  <p className="text-sm text-gray-400">Starting camera...</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
                  <svg className="w-10 h-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-center text-gray-300">{cameraError}</p>
                </div>
              )}

              {/* Recording indicator overlay */}
              {isRecording && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  REC
                </div>
              )}

              {cameraReady && !isRecording && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white px-2.5 py-1 rounded-full text-xs">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Camera Ready
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-center gap-4">
                {/* Record / Stop button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={submitting}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white scale-110'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50`}
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? (
                    // Stop icon
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    // Mic icon
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                {isRecording
                  ? 'Speaking... click the button to stop and review'
                  : 'Click the microphone to start recording your answer'}
              </p>
            </div>
          </div>

          {/* Right: Question + Transcript + Actions (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Question Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                  {question.category || 'Question'}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">Question {currentIndex + 1} of {totalQuestions}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {question.text}
              </h2>
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Your Answer
                  {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                </h3>
                {transcript && (
                  <button onClick={() => { setTranscript(''); interimRef.current = ''; }}
                    className="text-xs text-gray-400 hover:text-red-500 transition">
                    Clear
                  </button>
                )}
              </div>

              <div className="min-h-[120px] max-h-[200px] overflow-y-auto">
                {transcript ? (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px] text-gray-300">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="text-sm">Click the microphone to start speaking</p>
                  </div>
                )}
              </div>

              {/* Manual edit */}
              {!isRecording && transcript && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <textarea
                    value={transcript}
                    onChange={(e) => { setTranscript(e.target.value); interimRef.current = e.target.value; }}
                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Edit your answer if needed..."
                  />
                </div>
              )}

              {/* Or type directly */}
              {!isRecording && !transcript && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <textarea
                    value={transcript}
                    onChange={(e) => { setTranscript(e.target.value); interimRef.current = e.target.value; }}
                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Or type your answer here..."
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={handleSkip} disabled={submitting}
                className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50">
                Skip
              </button>
              <button onClick={handleSubmit} disabled={submitting || (!transcript.trim())}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {currentIndex + 1 === totalQuestions ? 'Analyzing with AI...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    {currentIndex + 1 === totalQuestions ? 'Submit & Finish' : 'Submit Answer'}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Tips</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Speak clearly and at a natural pace</li>
                <li>• Structure your answer with key points</li>
                <li>• You can edit the transcript before submitting</li>
                <li>• Use the STAR method for behavioral questions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
