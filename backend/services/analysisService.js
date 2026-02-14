// ============================================================
// Interview Analysis Service
// Simulated AI analysis with keyword matching, sentiment, scoring
// ============================================================

const QUESTION_BANK = {
  technical: {
    easy: [
      { text: "What is the difference between let, const, and var in JavaScript?", expectedKeywords: ["scope", "hoisting", "block", "function", "reassign", "mutable", "immutable"] },
      { text: "Explain what an API is and how it works.", expectedKeywords: ["interface", "request", "response", "endpoint", "HTTP", "REST", "client", "server"] },
      { text: "What is the difference between SQL and NoSQL databases?", expectedKeywords: ["relational", "schema", "table", "document", "flexible", "structured", "MongoDB", "MySQL"] },
      { text: "What is version control and why is it important?", expectedKeywords: ["git", "track", "changes", "collaborate", "branch", "merge", "history", "repository"] },
      { text: "Explain the concept of responsive web design.", expectedKeywords: ["media queries", "flexible", "viewport", "mobile", "breakpoints", "CSS", "grid", "layout"] },
    ],
    medium: [
      { text: "Explain the concept of closures in JavaScript with an example.", expectedKeywords: ["function", "scope", "variable", "inner", "outer", "lexical", "access", "memory"] },
      { text: "What are the main principles of Object-Oriented Programming?", expectedKeywords: ["encapsulation", "inheritance", "polymorphism", "abstraction", "class", "object"] },
      { text: "Describe the event loop in Node.js and how it handles asynchronous operations.", expectedKeywords: ["callback", "queue", "stack", "non-blocking", "single-threaded", "async", "promise"] },
      { text: "What is the difference between REST and GraphQL?", expectedKeywords: ["endpoint", "query", "mutation", "overfetching", "schema", "resolver", "flexibility"] },
      { text: "Explain how indexing works in databases and why it's important.", expectedKeywords: ["performance", "search", "B-tree", "query", "speed", "lookup", "overhead"] },
    ],
    hard: [
      { text: "Explain microservices architecture and its trade-offs compared to monolithic architecture.", expectedKeywords: ["distributed", "scalability", "independent", "deployment", "complexity", "communication", "service", "decoupled"] },
      { text: "How would you design a rate limiter for a high-traffic API?", expectedKeywords: ["token bucket", "sliding window", "distributed", "Redis", "throttle", "middleware", "limit"] },
      { text: "Describe how garbage collection works in JavaScript's V8 engine.", expectedKeywords: ["mark", "sweep", "heap", "memory", "generational", "scavenge", "reference", "allocation"] },
      { text: "Explain the CAP theorem and its implications for distributed systems.", expectedKeywords: ["consistency", "availability", "partition", "tolerance", "trade-off", "distributed", "network"] },
      { text: "How would you implement authentication and authorization in a microservices environment?", expectedKeywords: ["JWT", "OAuth", "token", "gateway", "service", "SSO", "RBAC", "session"] },
    ]
  },
  behavioral: {
    easy: [
      { text: "Tell me about yourself and your background.", expectedKeywords: ["experience", "education", "passion", "skills", "career", "goal", "background"] },
      { text: "Why are you interested in this position?", expectedKeywords: ["growth", "opportunity", "skills", "company", "challenge", "contribution", "passion"] },
      { text: "How do you handle stress at work?", expectedKeywords: ["prioritize", "manage", "calm", "organize", "communicate", "break", "focus"] },
      { text: "Describe your ideal work environment.", expectedKeywords: ["collaborative", "supportive", "growth", "communication", "flexible", "team", "learning"] },
      { text: "What are your greatest strengths?", expectedKeywords: ["skill", "ability", "example", "strength", "demonstrate", "impact", "result"] },
    ],
    medium: [
      { text: "Tell me about a time you had to deal with a difficult team member.", expectedKeywords: ["communication", "conflict", "resolution", "listen", "compromise", "professional", "outcome"] },
      { text: "Describe a situation where you had to meet a tight deadline.", expectedKeywords: ["prioritize", "organize", "plan", "communicate", "deliver", "pressure", "time management"] },
      { text: "Give an example of a time you showed leadership.", expectedKeywords: ["initiative", "guide", "team", "decision", "responsibility", "motivate", "result"] },
      { text: "Tell me about a time you failed and what you learned from it.", expectedKeywords: ["mistake", "learn", "improve", "reflect", "grow", "adapt", "accountability"] },
      { text: "How do you handle receiving constructive criticism?", expectedKeywords: ["feedback", "improve", "open", "listen", "learn", "change", "perspective"] },
    ],
    hard: [
      { text: "Describe a situation where you had to make a decision with incomplete information.", expectedKeywords: ["analyze", "risk", "judgment", "data", "decision", "uncertain", "outcome", "evaluate"] },
      { text: "Tell me about a time you had to influence stakeholders who disagreed with your approach.", expectedKeywords: ["persuade", "data", "communicate", "compromise", "evidence", "stakeholder", "alignment"] },
      { text: "Describe a complex project you managed from start to finish.", expectedKeywords: ["plan", "execute", "coordinate", "milestone", "challenge", "deliver", "team", "scope"] },
      { text: "Tell me about a time you had to adapt to a major change in your organization.", expectedKeywords: ["adapt", "flexible", "change", "resilient", "positive", "learn", "transition"] },
      { text: "How would you handle a situation where your team disagrees with upper management's direction?", expectedKeywords: ["communicate", "align", "understand", "bridge", "advocate", "professional", "compromise"] },
    ]
  },
  'system-design': {
    easy: [
      { text: "How would you design a URL shortening service like bit.ly?", expectedKeywords: ["hash", "database", "redirect", "unique", "encode", "store", "lookup"] },
      { text: "Design a basic chat application.", expectedKeywords: ["websocket", "real-time", "message", "user", "room", "store", "notification"] },
      { text: "How would you design a simple file storage system?", expectedKeywords: ["upload", "download", "metadata", "storage", "access", "organize", "permission"] },
    ],
    medium: [
      { text: "Design a notification system for a social media platform.", expectedKeywords: ["push", "queue", "real-time", "preference", "batch", "priority", "delivery"] },
      { text: "How would you design a caching layer for a web application?", expectedKeywords: ["Redis", "TTL", "invalidation", "hit rate", "eviction", "LRU", "distributed"] },
      { text: "Design an e-commerce shopping cart system.", expectedKeywords: ["session", "database", "inventory", "pricing", "checkout", "scalable", "state"] },
    ],
    hard: [
      { text: "Design a real-time collaborative document editor like Google Docs.", expectedKeywords: ["CRDT", "operational transform", "websocket", "conflict", "sync", "cursor", "concurrent"] },
      { text: "How would you design a video streaming platform like YouTube?", expectedKeywords: ["CDN", "encoding", "transcoding", "storage", "streaming", "recommendation", "scale"] },
      { text: "Design a distributed task scheduling system.", expectedKeywords: ["queue", "worker", "priority", "retry", "idempotent", "distributed", "fault-tolerant"] },
    ]
  },
  general: {
    easy: [
      { text: "What motivates you in your career?", expectedKeywords: ["growth", "learning", "impact", "challenge", "passion", "goal", "purpose"] },
      { text: "Where do you see yourself in 5 years?", expectedKeywords: ["growth", "leadership", "skills", "contribute", "develop", "career", "goal"] },
      { text: "How do you stay updated with industry trends?", expectedKeywords: ["read", "learn", "community", "conference", "practice", "course", "follow"] },
    ],
    medium: [
      { text: "How do you approach learning a new technology or tool?", expectedKeywords: ["research", "practice", "documentation", "project", "hands-on", "understand", "apply"] },
      { text: "Describe your approach to problem-solving.", expectedKeywords: ["analyze", "break down", "research", "solution", "test", "iterate", "systematic"] },
      { text: "How do you prioritize tasks when everything seems urgent?", expectedKeywords: ["prioritize", "impact", "deadline", "communicate", "delegate", "organize", "focus"] },
    ],
    hard: [
      { text: "How would you handle a situation where you strongly disagree with a technical decision made by your team lead?", expectedKeywords: ["communicate", "data", "respect", "evidence", "discuss", "professional", "alternative"] },
      { text: "Describe how you would onboard yourself into a large, unfamiliar codebase.", expectedKeywords: ["documentation", "explore", "ask", "understand", "architecture", "test", "incremental"] },
      { text: "What would you do if you discovered a critical security vulnerability in production?", expectedKeywords: ["report", "immediate", "patch", "communicate", "assess", "document", "prevent"] },
    ]
  }
};

// Positive sentiment words
const POSITIVE_WORDS = ['achieved', 'accomplished', 'improved', 'successfully', 'effectively', 'efficiently', 'collaborated', 'innovative', 'solved', 'implemented', 'developed', 'created', 'designed', 'optimized', 'delivered', 'led', 'managed', 'built', 'enhanced', 'streamlined', 'excellent', 'great', 'best', 'strong', 'confident', 'proactive', 'initiative', 'passionate', 'dedicated', 'committed'];

// Negative/weak sentiment words
const WEAK_WORDS = ['maybe', 'perhaps', 'i think', 'i guess', 'not sure', 'kind of', 'sort of', 'probably', 'might', 'um', 'uh', "don't know", 'confused', 'difficult', 'struggle', 'hard to say', 'no idea', 'never'];

// Filler words (reduce communication score)
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so yeah', 'i mean'];

/**
 * Generate interview questions for a session
 */
function generateQuestions(category = 'mixed', difficulty = 'medium', count = 5) {
  const questions = [];

  if (category === 'mixed') {
    const categories = ['technical', 'behavioral', 'system-design', 'general'];
    for (let i = 0; i < count; i++) {
      const cat = categories[i % categories.length];
      const pool = QUESTION_BANK[cat]?.[difficulty] || QUESTION_BANK[cat]?.['medium'] || [];
      if (pool.length > 0) {
        const q = pool[Math.floor(Math.random() * pool.length)];
        questions.push({
          text: q.text,
          order: i,
          category: cat,
          expectedKeywords: q.expectedKeywords
        });
      }
    }
  } else {
    const pool = QUESTION_BANK[category]?.[difficulty] || QUESTION_BANK[category]?.['medium'] || [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      questions.push({
        text: shuffled[i].text,
        order: i,
        category: category,
        expectedKeywords: shuffled[i].expectedKeywords
      });
    }
  }

  // Ensure we have at least `count` questions (fill with general if needed)
  while (questions.length < count) {
    const fallback = QUESTION_BANK.general.medium;
    const q = fallback[questions.length % fallback.length];
    questions.push({
      text: q.text,
      order: questions.length,
      category: 'general',
      expectedKeywords: q.expectedKeywords
    });
  }

  return questions;
}

/**
 * Analyze a single answer against expected keywords
 */
function analyzeAnswer(answer, expectedKeywords = []) {
  const lowerAnswer = answer.toLowerCase();
  const words = lowerAnswer.split(/\s+/);
  const wordCount = words.length;

  // Keyword matching
  let keywordsFound = 0;
  const matchedKeywords = [];
  for (const keyword of expectedKeywords) {
    if (lowerAnswer.includes(keyword.toLowerCase())) {
      keywordsFound++;
      matchedKeywords.push(keyword);
    }
  }
  const keywordScore = expectedKeywords.length > 0 
    ? (keywordsFound / expectedKeywords.length) * 10 
    : 5;

  // Sentiment analysis
  let positiveCount = 0;
  let weakCount = 0;
  for (const word of POSITIVE_WORDS) {
    if (lowerAnswer.includes(word)) positiveCount++;
  }
  for (const word of WEAK_WORDS) {
    if (lowerAnswer.includes(word)) weakCount++;
  }
  const sentimentScore = Math.min(10, Math.max(1, 5 + positiveCount - (weakCount * 2)));

  // Communication score (based on length, filler words, structure)
  let fillerCount = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerAnswer.match(regex);
    if (matches) fillerCount += matches.length;
  }
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;
  
  let communicationScore = 5;
  if (wordCount >= 30) communicationScore += 1;
  if (wordCount >= 60) communicationScore += 1;
  if (wordCount >= 100) communicationScore += 1;
  if (fillerRatio < 0.05) communicationScore += 1;
  if (fillerRatio < 0.02) communicationScore += 1;
  communicationScore = Math.min(10, Math.max(1, communicationScore - Math.floor(fillerRatio * 20)));

  // Confidence score (absence of weak words, use of positive words, answer length)
  let confidenceScore = 5;
  if (weakCount === 0) confidenceScore += 2;
  else if (weakCount <= 1) confidenceScore += 1;
  else confidenceScore -= weakCount;
  if (positiveCount >= 2) confidenceScore += 1;
  if (positiveCount >= 4) confidenceScore += 1;
  if (wordCount >= 50) confidenceScore += 1;
  confidenceScore = Math.min(10, Math.max(1, confidenceScore));

  const overallScore = Math.round(
    (keywordScore * 0.35 + sentimentScore * 0.15 + communicationScore * 0.25 + confidenceScore * 0.25) * 10
  ) / 10;

  // Generate feedback
  let feedback = '';
  if (overallScore >= 8) {
    feedback = 'Excellent answer! You demonstrated strong knowledge and communicated clearly.';
  } else if (overallScore >= 6) {
    feedback = 'Good answer. You covered key points but could elaborate more on some areas.';
  } else if (overallScore >= 4) {
    feedback = 'Decent attempt. Try to include more specific details and relevant terminology.';
  } else {
    feedback = 'This answer needs improvement. Focus on addressing the core question with specific examples.';
  }

  if (matchedKeywords.length > 0) {
    feedback += ` Good use of: ${matchedKeywords.join(', ')}.`;
  }
  if (fillerCount > 2) {
    feedback += ' Try to reduce filler words for more polished delivery.';
  }
  if (wordCount < 30) {
    feedback += ' Consider providing more detailed responses.';
  }

  return {
    score: overallScore,
    keywordScore: Math.round(keywordScore * 10) / 10,
    sentimentScore: Math.round(sentimentScore * 10) / 10,
    communicationScore: Math.round(communicationScore * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 10) / 10,
    feedback,
    matchedKeywords,
    wordCount
  };
}

/**
 * Analyze all answers in a session and generate final report
 */
function generateReport(questions, answers) {
  const questionScores = [];
  let totalCommunication = 0;
  let totalConfidence = 0;
  let totalTechnical = 0;
  let totalOverall = 0;
  const allStrengths = [];
  const allImprovements = [];

  for (const answer of answers) {
    const question = questions[answer.questionIndex];
    if (!question) continue;

    const analysis = analyzeAnswer(answer.transcript, question.expectedKeywords || []);

    questionScores.push({
      questionIndex: answer.questionIndex,
      score: analysis.score,
      feedback: analysis.feedback
    });

    totalCommunication += analysis.communicationScore;
    totalConfidence += analysis.confidenceScore;
    totalTechnical += analysis.keywordScore;
    totalOverall += analysis.score;

    // Collect strengths
    if (analysis.score >= 7) {
      allStrengths.push(`Strong answer on: "${question.text.substring(0, 50)}..."`);
    }
    if (analysis.matchedKeywords.length >= 3) {
      allStrengths.push(`Good use of technical terminology (${analysis.matchedKeywords.join(', ')})`);
    }
    if (analysis.communicationScore >= 8) {
      allStrengths.push('Clear and articulate communication');
    }
    if (analysis.confidenceScore >= 8) {
      allStrengths.push('Confident and assertive delivery');
    }

    // Collect improvements
    if (analysis.score < 5) {
      allImprovements.push(`Review concepts related to: "${question.text.substring(0, 50)}..."`);
    }
    if (analysis.wordCount < 30) {
      allImprovements.push('Provide more detailed and comprehensive answers');
    }
    if (analysis.communicationScore < 5) {
      allImprovements.push('Work on reducing filler words and improving clarity');
    }
    if (analysis.confidenceScore < 5) {
      allImprovements.push('Practice delivering answers with more confidence');
    }
  }

  const count = answers.length || 1;

  // Deduplicate strengths and improvements
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
  const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5);

  // Add default entries if empty
  if (uniqueStrengths.length === 0) {
    uniqueStrengths.push('Completed the interview session');
  }
  if (uniqueImprovements.length === 0) {
    uniqueImprovements.push('Continue practicing with more interview questions');
  }

  return {
    communicationScore: Math.round((totalCommunication / count) * 10) / 10,
    confidenceScore: Math.round((totalConfidence / count) * 10) / 10,
    technicalScore: Math.round((totalTechnical / count) * 10) / 10,
    overallScore: Math.round((totalOverall / count) * 10) / 10,
    strengths: uniqueStrengths,
    improvements: uniqueImprovements,
    questionScores,
    totalAnswered: answers.length,
    totalQuestions: questions.length
  };
}

module.exports = { generateQuestions, analyzeAnswer, generateReport };
