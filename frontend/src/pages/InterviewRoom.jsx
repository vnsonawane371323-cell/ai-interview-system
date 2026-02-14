import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const [sessionData, setSessionData] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);

  // Load session
  useEffect(() => {
    const stored = sessionStorage.getItem(`interview_${sessionId}`);
    if (stored) {
      const data = JSON.parse(stored);
      setSessionData(data);
      setCurrentQ(data.currentQuestion);
      setQuestionIndex(0);
      setTotalQuestions(data.totalQuestions);
    } else {
      setError('Session not found. Please start a new interview.');
    }
  }, [sessionId]);

  // Setup webcam
  useEffect(() => {
    let cancelled = false;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch {
        console.warn('Camera not available');
        setCameraReady(true); // proceed without camera
      }
    };
    initCamera();
    return () => { cancelled = true; cleanup(); };
  }, []);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Timer
  useEffect(() => {
    if (!isRecording) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = () => {
    setTranscript('');
    setTimeLeft(120);
    setIsRecording(true);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      let finalTranscript = '';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + ' ';
          } else {
            interim = t;
          }
        }
        setTranscript(finalTranscript + interim);
      };
      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') console.warn('Speech error:', e.error);
      };
      recognition.onend = () => {
        // Restart if still recording
        if (recognitionRef.current) {
          try { recognition.start(); } catch {}
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSubmitAnswer = async () => {
    stopRecording();
    setSubmitting(true);

    try {
      const res = await interviewAPI.submitAnswer({
        sessionId,
        transcript: transcript || '(no answer provided)',
        questionIndex,
        duration: 120 - timeLeft
      });

      if (res.data.completed) {
        setFinished(true);
        cleanup();
        setTimeout(() => navigate(`/report/${sessionId}`), 1500);
      } else {
        setCurrentQ(res.data.nextQuestion);
        setQuestionIndex(prev => prev + 1);
        setTranscript('');
        setTimeLeft(120);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const skipQuestion = () => {
    setTranscript('(skipped)');
    setTimeout(handleSubmitAnswer, 100);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0;
  const timePercent = (timeLeft / 120) * 100;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-gray-900 font-semibold text-lg">{error}</h2>
          <button onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Interview Complete!</h2>
          <p className="text-gray-500 mt-2">Generating your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { if (confirm('Leave interview? Progress will be lost.')) { cleanup(); navigate('/dashboard'); } }}
              className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Question {questionIndex + 1} of {totalQuestions}
              </p>
              <p className="text-xs text-gray-400 capitalize">{sessionData?.category} · {sessionData?.difficulty}</p>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold
            ${timeLeft <= 30 ? 'text-red-600 bg-red-50' : timeLeft <= 60 ? 'text-amber-600 bg-amber-50' : 'text-gray-700 bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-6xl mx-auto mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Question & Transcript */}
          <div className="lg:col-span-2 space-y-5">
            {/* Question Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">{questionIndex + 1}</span>
                </div>
                <div>
                  <p className="text-gray-900 text-lg font-medium leading-relaxed">
                    {currentQ?.text || 'Loading question...'}
                  </p>
                  {currentQ?.category && (
                    <span className="inline-block mt-3 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full">
                      {currentQ.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Your Answer</h3>
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium">Recording</span>
                  </div>
                )}
              </div>
              <div className="min-h-[150px] max-h-[300px] overflow-y-auto rounded-xl bg-gray-50 p-4 border border-gray-100">
                {transcript ? (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-gray-400 italic">
                    {isRecording ? 'Listening... Speak your answer clearly.' : 'Click "Start Recording" to begin answering.'}
                  </p>
                )}
              </div>

              {/* Timer bar */}
              {isRecording && (
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 30 ? 'bg-red-400' : 'bg-blue-400'}`}
                    style={{ width: `${timePercent}%` }} />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button onClick={startRecording} disabled={submitting}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                  Start Recording
                </button>
              ) : (
                <>
                  <button onClick={handleSubmitAnswer} disabled={submitting}
                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Answer
                      </>
                    )}
                  </button>
                  <button onClick={stopRecording} disabled={submitting}
                    className="px-4 py-3.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  </button>
                </>
              )}
              <button onClick={skipQuestion} disabled={submitting || isRecording}
                className="px-5 py-3.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition text-sm font-medium border border-gray-200 disabled:opacity-40">
                Skip
              </button>
            </div>
          </div>

          {/* Right - Video */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              <div className="relative bg-gray-900 aspect-[4/3]">
                <video ref={videoRef} autoPlay playsInline muted
                  className="w-full h-full object-cover" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <svg className="animate-spin w-8 h-8 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Tips</h3>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    Speak clearly and at a natural pace
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    Use the STAR method for behavioral questions
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    It's okay to pause and think before answering
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    Maintain eye contact with the camera
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
