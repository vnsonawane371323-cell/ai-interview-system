import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';

const TIMER_DURATION = 120; // 2 minutes per question

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Interview state
  const [question, setQuestion] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Media state
  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [recordingStartTime, setRecordingStartTime] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load first question on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem(`interview_${sessionId}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setQuestion(data.question);
      setCurrentIdx(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);
    } else {
      // No saved data, go back to dashboard
      navigate('/dashboard');
    }
    return () => {
      cleanup();
    };
  }, [sessionId]);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setError('');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera/microphone. Please grant permissions and try again.');
    }
  }, []);

  useEffect(() => {
    initCamera();
  }, [initCamera]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        if (event.error === 'no-speech') return; // ignore
      };

      recognition.onend = () => {
        // Restart if still recording
        if (recording && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, [recording]);

  // Timer
  useEffect(() => {
    if (recording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [recording, timeLeft]);

  const cleanup = () => {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const startRecording = () => {
    setRecording(true);
    setTranscript('');
    setTimeLeft(TIMER_DURATION);
    setRecordingStartTime(Date.now());

    // Start speech recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch(e) {}
    }

    // Start media recording (audio/video for visual feedback)
    if (streamRef.current) {
      try {
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        mediaRecorderRef.current = recorder;
        recorder.start();
      } catch(e) {
        console.log('MediaRecorder not available, using transcript only');
      }
    }
  };

  const stopRecording = () => {
    setRecording(false);
    clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch(e) {}
    }
  };

  const handleSubmitAnswer = async () => {
    stopRecording();
    setSubmitting(true);

    const duration = recordingStartTime ? Math.round((Date.now() - recordingStartTime) / 1000) : 0;
    const answerText = transcript.trim() || 'No response provided';

    try {
      const res = await interviewAPI.submitAnswer({
        sessionId,
        transcript: answerText,
        duration
      });

      if (res.data.finished) {
        setFinished(true);
        cleanup();
        // Navigate to report
        setTimeout(() => navigate(`/report/${sessionId}`), 1500);
      } else {
        // Move to next question
        setQuestion(res.data.question);
        setCurrentIdx(res.data.currentQuestion);
        setTotalQuestions(res.data.totalQuestions);
        setTranscript('');
        setTimeLeft(TIMER_DURATION);
        setRecordingStartTime(null);

        // Save state
        sessionStorage.setItem(`interview_${sessionId}`, JSON.stringify(res.data));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndEarly = async () => {
    if (!confirm('Are you sure you want to end the interview early?')) return;
    stopRecording();
    try {
      await interviewAPI.complete({ sessionId });
      cleanup();
      navigate(`/report/${sessionId}`);
    } catch (err) {
      setError('Failed to end interview');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIdx) / totalQuestions) * 100;

  if (finished) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Interview Complete!</h1>
          <p className="text-slate-400 mb-6">Generating your performance report...</p>
          <svg className="animate-spin w-8 h-8 text-blue-500 mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="text-white font-medium">Question {currentIdx + 1}</span>
              <span className="text-slate-500"> of {totalQuestions}</span>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            recording
              ? timeLeft <= 30
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
          </div>

          <button onClick={handleEndEarly}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 rounded-lg transition">
            End Interview
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* Left: Camera */}
        <div className="flex flex-col gap-4">
          {/* Video Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />

            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <svg className="w-16 h-16 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-500">Initializing camera...</p>
                </div>
              </div>
            )}

            {/* Recording indicator */}
            {recording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600/90 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">REC</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!recording ? (
              <button onClick={startRecording} disabled={!cameraReady || submitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full" />
                Start Recording
              </button>
            ) : (
              <button onClick={handleSubmitAnswer} disabled={submitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium rounded-xl transition flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    Submit &amp; Next
                  </>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}
        </div>

        {/* Right: Question & Transcript */}
        <div className="flex flex-col gap-4">
          {/* Question Card */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full capitalize">
                {question?.category || 'general'}
              </span>
              <span className="text-slate-500 text-sm">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-white leading-relaxed">
              {question?.text || 'Loading question...'}
            </h2>
          </div>

          {/* Live Transcript */}
          <div className="glass-card rounded-2xl p-6 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400">Live Transcript</h3>
              {recording && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Listening...</span>
                </div>
              )}
            </div>

            <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
              {transcript ? (
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-slate-600 text-sm text-center">
                    {recording
                      ? 'Start speaking — your words will appear here...'
                      : 'Click "Start Recording" and answer the question. Your speech will be transcribed in real-time.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-slate-300 font-medium">Tips</p>
                <p className="text-xs text-slate-500 mt-1">
                  Speak clearly and use specific examples. Structure your answer with context, action, and result.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
