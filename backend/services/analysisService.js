// ============================================================
// Interview Analysis Service
// Unique field-specific questions + Gemini AI analysis
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
let genAI = null;
let geminiModel = null;

function initGemini() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return geminiModel;
}

// ============================================================
// MASSIVE QUESTION BANK — 15+ unique questions per category/difficulty
// ============================================================
const QUESTION_BANK = {
  technical: {
    easy: [
      { text: "What is the difference between let, const, and var in JavaScript?", expectedKeywords: ["scope", "hoisting", "block", "function", "reassign", "mutable", "immutable"] },
      { text: "Explain what an API is and how it works.", expectedKeywords: ["interface", "request", "response", "endpoint", "HTTP", "REST", "client", "server"] },
      { text: "What is the difference between SQL and NoSQL databases?", expectedKeywords: ["relational", "schema", "table", "document", "flexible", "structured"] },
      { text: "What is version control and why is it important?", expectedKeywords: ["git", "track", "changes", "collaborate", "branch", "merge", "history"] },
      { text: "Explain the concept of responsive web design.", expectedKeywords: ["media queries", "flexible", "viewport", "mobile", "breakpoints", "CSS"] },
      { text: "What is the Document Object Model (DOM)?", expectedKeywords: ["tree", "nodes", "HTML", "elements", "manipulate", "browser", "document"] },
      { text: "Explain the difference between HTTP and HTTPS.", expectedKeywords: ["secure", "SSL", "TLS", "encryption", "certificate", "port", "data"] },
      { text: "What are the different data types in JavaScript?", expectedKeywords: ["string", "number", "boolean", "object", "array", "null", "undefined", "symbol"] },
      { text: "What is the purpose of a package manager like npm or yarn?", expectedKeywords: ["dependencies", "install", "manage", "version", "packages", "node_modules"] },
      { text: "Explain the difference between frontend and backend development.", expectedKeywords: ["client", "server", "browser", "database", "UI", "API", "logic"] },
      { text: "What is CSS Box Model?", expectedKeywords: ["margin", "border", "padding", "content", "width", "height", "box-sizing"] },
      { text: "What are arrays and how are they used in programming?", expectedKeywords: ["index", "elements", "store", "iterate", "ordered", "collection", "zero-based"] },
      { text: "What is JSON and why is it commonly used?", expectedKeywords: ["JavaScript", "object", "notation", "data", "exchange", "format", "parse", "stringify"] },
      { text: "Explain the difference between == and === in JavaScript.", expectedKeywords: ["type coercion", "strict", "equality", "comparison", "value", "type"] },
      { text: "What is a function and why are functions important in programming?", expectedKeywords: ["reusable", "parameters", "return", "modular", "call", "invoke", "DRY"] },
    ],
    medium: [
      { text: "Explain the concept of closures in JavaScript with an example.", expectedKeywords: ["function", "scope", "variable", "inner", "outer", "lexical", "access"] },
      { text: "What are the main principles of Object-Oriented Programming?", expectedKeywords: ["encapsulation", "inheritance", "polymorphism", "abstraction", "class"] },
      { text: "Describe the event loop in Node.js and how it handles asynchronous operations.", expectedKeywords: ["callback", "queue", "stack", "non-blocking", "single-threaded", "async"] },
      { text: "What is the difference between REST and GraphQL?", expectedKeywords: ["endpoint", "query", "mutation", "overfetching", "schema", "resolver"] },
      { text: "Explain how indexing works in databases and why it's important.", expectedKeywords: ["performance", "search", "B-tree", "query", "speed", "lookup"] },
      { text: "What are Promises in JavaScript and how do they differ from callbacks?", expectedKeywords: ["resolve", "reject", "then", "catch", "async", "chain", "callback hell"] },
      { text: "Explain the concept of middleware in Express.js.", expectedKeywords: ["request", "response", "next", "pipeline", "function", "authentication", "logging"] },
      { text: "What is the virtual DOM and how does React use it?", expectedKeywords: ["diff", "reconciliation", "performance", "render", "real DOM", "update", "component"] },
      { text: "Describe the differences between SQL JOIN types.", expectedKeywords: ["inner", "left", "right", "full", "outer", "cross", "tables", "relationship"] },
      { text: "What is Docker and why is containerization important?", expectedKeywords: ["container", "image", "isolate", "deploy", "environment", "lightweight", "portable"] },
      { text: "Explain the concept of state management in React applications.", expectedKeywords: ["useState", "Redux", "context", "props", "re-render", "store", "immutable"] },
      { text: "What are WebSockets and when would you use them over HTTP?", expectedKeywords: ["bidirectional", "real-time", "persistent", "connection", "push", "low-latency"] },
      { text: "How does authentication with JWT tokens work?", expectedKeywords: ["token", "payload", "signature", "header", "expire", "stateless", "verify", "Bearer"] },
      { text: "What is the difference between TCP and UDP protocols?", expectedKeywords: ["reliable", "connection", "handshake", "datagram", "ordered", "fast", "streaming"] },
      { text: "Explain the concept of database normalization.", expectedKeywords: ["redundancy", "normal forms", "1NF", "2NF", "3NF", "dependency", "decomposition"] },
    ],
    hard: [
      { text: "Explain microservices architecture and its trade-offs compared to monolithic architecture.", expectedKeywords: ["distributed", "scalability", "independent", "deployment", "complexity", "service"] },
      { text: "How would you design a rate limiter for a high-traffic API?", expectedKeywords: ["token bucket", "sliding window", "distributed", "Redis", "throttle", "limit"] },
      { text: "Describe how garbage collection works in JavaScript's V8 engine.", expectedKeywords: ["mark", "sweep", "heap", "memory", "generational", "scavenge", "reference"] },
      { text: "Explain the CAP theorem and its implications for distributed systems.", expectedKeywords: ["consistency", "availability", "partition", "tolerance", "trade-off"] },
      { text: "How would you implement authentication and authorization in a microservices environment?", expectedKeywords: ["JWT", "OAuth", "token", "gateway", "SSO", "RBAC"] },
      { text: "Explain how a load balancer works and different load balancing algorithms.", expectedKeywords: ["round robin", "least connections", "health check", "reverse proxy", "horizontal scaling"] },
      { text: "What are design patterns and explain the Observer and Singleton patterns.", expectedKeywords: ["pattern", "observer", "subscribe", "notify", "singleton", "instance", "reusable"] },
      { text: "Describe how HTTPS/TLS handshake works step by step.", expectedKeywords: ["certificate", "public key", "private key", "symmetric", "asymmetric", "session key"] },
      { text: "Explain database sharding strategies and their trade-offs.", expectedKeywords: ["horizontal", "partition", "shard key", "range", "hash", "consistent", "rebalance"] },
      { text: "How would you implement a CI/CD pipeline from scratch?", expectedKeywords: ["continuous", "integration", "deployment", "testing", "automation", "pipeline", "staging"] },
      { text: "Explain event-driven architecture and message queues like RabbitMQ or Kafka.", expectedKeywords: ["producer", "consumer", "topic", "queue", "async", "decouple", "event sourcing"] },
      { text: "What is the difference between horizontal and vertical scaling, and when would you use each?", expectedKeywords: ["scale out", "scale up", "distributed", "resources", "cost", "bottleneck"] },
      { text: "Describe how you would optimize a slow database query in production.", expectedKeywords: ["explain", "index", "query plan", "N+1", "cache", "denormalize", "profiling"] },
      { text: "What are race conditions and how do you prevent them?", expectedKeywords: ["concurrent", "mutex", "lock", "semaphore", "atomic", "deadlock", "thread-safe"] },
      { text: "Explain how content delivery networks (CDNs) work and their benefits.", expectedKeywords: ["edge", "cache", "latency", "origin", "geographic", "static assets", "invalidation"] },
    ]
  },
  behavioral: {
    easy: [
      { text: "Tell me about yourself and your professional background.", expectedKeywords: ["experience", "education", "passion", "skills", "career", "goal"] },
      { text: "Why are you interested in this position?", expectedKeywords: ["growth", "opportunity", "skills", "company", "challenge", "contribution"] },
      { text: "How do you handle stress at work?", expectedKeywords: ["prioritize", "manage", "calm", "organize", "communicate", "focus"] },
      { text: "Describe your ideal work environment.", expectedKeywords: ["collaborative", "supportive", "growth", "communication", "flexible", "team"] },
      { text: "What are your greatest professional strengths?", expectedKeywords: ["skill", "ability", "example", "strength", "demonstrate", "impact"] },
      { text: "How do you manage your time and stay organized?", expectedKeywords: ["calendar", "priority", "tasks", "deadline", "plan", "tools"] },
      { text: "What type of work culture do you thrive in?", expectedKeywords: ["team", "autonomy", "feedback", "open", "innovative", "structured"] },
      { text: "Describe a project you are most proud of.", expectedKeywords: ["challenge", "solution", "team", "result", "impact", "learned"] },
      { text: "How do you approach working with a new team?", expectedKeywords: ["introduce", "listen", "learn", "contribute", "adapt", "communicate"] },
      { text: "What motivates you to do your best work?", expectedKeywords: ["impact", "growth", "challenge", "purpose", "recognition", "learning"] },
      { text: "How do you handle feedback from your manager?", expectedKeywords: ["listen", "improve", "open", "constructive", "implement", "grow"] },
      { text: "Describe a time when you went above and beyond at work.", expectedKeywords: ["initiative", "extra", "impact", "team", "result", "dedication"] },
      { text: "What do you consider your biggest professional weakness?", expectedKeywords: ["honest", "improve", "aware", "working on", "steps", "growth"] },
      { text: "How do you stay motivated during repetitive tasks?", expectedKeywords: ["goal", "music", "break", "focus", "improve process", "routine"] },
      { text: "Tell me about a time you helped a colleague succeed.", expectedKeywords: ["support", "mentor", "share", "team", "help", "teach"] },
    ],
    medium: [
      { text: "Tell me about a time you had to deal with a difficult team member.", expectedKeywords: ["communication", "conflict", "resolution", "listen", "compromise", "professional"] },
      { text: "Describe a situation where you had to meet a tight deadline.", expectedKeywords: ["prioritize", "organize", "plan", "communicate", "deliver", "pressure"] },
      { text: "Give an example of a time you showed leadership.", expectedKeywords: ["initiative", "guide", "team", "decision", "responsibility", "motivate"] },
      { text: "Tell me about a time you failed and what you learned from it.", expectedKeywords: ["mistake", "learn", "improve", "reflect", "grow", "adapt"] },
      { text: "How do you handle receiving constructive criticism?", expectedKeywords: ["feedback", "improve", "open", "listen", "learn", "change"] },
      { text: "Describe a time you had to learn something quickly to complete a task.", expectedKeywords: ["research", "practice", "adapt", "resourceful", "deadline", "discipline"] },
      { text: "Tell me about a time you disagreed with your manager.", expectedKeywords: ["respectful", "data", "discuss", "compromise", "professional", "outcome"] },
      { text: "Give an example of when you had to multitask effectively.", expectedKeywords: ["prioritize", "organize", "delegate", "focus", "manage", "efficient"] },
      { text: "Describe a situation where you had to persuade others to accept your idea.", expectedKeywords: ["data", "presentation", "listen", "evidence", "compromise", "stakeholder"] },
      { text: "Tell me about a time you worked with a diverse team.", expectedKeywords: ["respect", "perspective", "inclusive", "collaborate", "learn", "cultural"] },
      { text: "Describe a challenging problem you solved creatively.", expectedKeywords: ["analyze", "approach", "creative", "solution", "thinking", "unconventional"] },
      { text: "How have you handled a situation where requirements changed mid-project?", expectedKeywords: ["adapt", "communicate", "flexible", "reprioritize", "scope", "stakeholder"] },
      { text: "Tell me about a time you had to deliver bad news to a stakeholder.", expectedKeywords: ["honest", "transparent", "empathy", "solution", "proactive", "plan"] },
      { text: "Describe how you've mentored or trained a junior colleague.", expectedKeywords: ["teach", "patient", "example", "guide", "feedback", "growth"] },
      { text: "Give an example of when you took ownership of a mistake.", expectedKeywords: ["accountability", "honest", "fix", "learn", "prevent", "responsible"] },
    ],
    hard: [
      { text: "Describe a situation where you had to make a decision with incomplete information.", expectedKeywords: ["analyze", "risk", "judgment", "data", "decision", "uncertain"] },
      { text: "Tell me about a time you had to influence stakeholders who disagreed with your approach.", expectedKeywords: ["persuade", "data", "communicate", "compromise", "evidence", "alignment"] },
      { text: "Describe a complex project you managed from start to finish.", expectedKeywords: ["plan", "execute", "coordinate", "milestone", "challenge", "deliver"] },
      { text: "Tell me about a time you had to adapt to a major organizational change.", expectedKeywords: ["adapt", "flexible", "change", "resilient", "positive", "learn"] },
      { text: "How would you handle a team member who is consistently underperforming?", expectedKeywords: ["communicate", "understand", "support", "expectations", "plan", "documentation"] },
      { text: "Describe a time when you had to balance competing priorities from different stakeholders.", expectedKeywords: ["negotiate", "prioritize", "transparent", "impact", "communicate", "trade-off"] },
      { text: "Tell me about a time you identified and mitigated a significant risk.", expectedKeywords: ["assess", "proactive", "plan", "contingency", "monitor", "communicate"] },
      { text: "How have you driven innovation within your team or organization?", expectedKeywords: ["propose", "experiment", "data", "pilot", "culture", "improvement"] },
      { text: "Describe a situation where you had to make an unpopular decision.", expectedKeywords: ["rationale", "communicate", "data", "courage", "outcome", "transparent"] },
      { text: "Tell me about navigating a situation with ambiguous or conflicting goals.", expectedKeywords: ["clarify", "align", "stakeholder", "prioritize", "communicate", "compromise"] },
      { text: "How have you built trust with a new team as a leader?", expectedKeywords: ["transparent", "listen", "deliver", "consistent", "empathy", "vulnerable"] },
      { text: "Describe a time you had to manage a crisis under pressure.", expectedKeywords: ["calm", "prioritize", "communicate", "action", "team", "resolve", "post-mortem"] },
      { text: "Tell me about a strategic decision you made that had long-term impact.", expectedKeywords: ["analysis", "vision", "data", "stakeholder", "outcome", "alignment"] },
      { text: "How do you handle ethical dilemmas in the workplace?", expectedKeywords: ["values", "integrity", "transparent", "consult", "principles", "courage"] },
      { text: "Describe a situation where you had to give difficult feedback to a senior person.", expectedKeywords: ["respectful", "specific", "data", "private", "constructive", "professional"] },
    ]
  },
  'system-design': {
    easy: [
      { text: "How would you design a URL shortening service like bit.ly?", expectedKeywords: ["hash", "database", "redirect", "unique", "encode", "store"] },
      { text: "Design a basic chat application.", expectedKeywords: ["websocket", "real-time", "message", "user", "room", "store"] },
      { text: "How would you design a simple file storage system?", expectedKeywords: ["upload", "download", "metadata", "storage", "access", "organize"] },
      { text: "Design a basic user authentication system.", expectedKeywords: ["password", "hash", "session", "token", "login", "register", "secure"] },
      { text: "How would you design a simple blogging platform?", expectedKeywords: ["CRUD", "posts", "users", "comments", "database", "categories"] },
      { text: "Design a basic to-do list application backend.", expectedKeywords: ["CRUD", "user", "tasks", "status", "priority", "database"] },
      { text: "How would you design a simple polling/voting system?", expectedKeywords: ["options", "votes", "results", "unique", "prevent", "real-time"] },
      { text: "Design a contact form backend with email notifications.", expectedKeywords: ["validate", "store", "email", "queue", "spam", "template"] },
      { text: "How would you design a basic image gallery application?", expectedKeywords: ["upload", "thumbnail", "storage", "metadata", "album", "resize"] },
      { text: "Design a simple event booking system.", expectedKeywords: ["events", "tickets", "capacity", "booking", "confirmation", "availability"] },
    ],
    medium: [
      { text: "Design a notification system for a social media platform.", expectedKeywords: ["push", "queue", "real-time", "preference", "batch", "priority"] },
      { text: "How would you design a caching layer for a web application?", expectedKeywords: ["Redis", "TTL", "invalidation", "hit rate", "eviction", "LRU"] },
      { text: "Design an e-commerce shopping cart system.", expectedKeywords: ["session", "database", "inventory", "pricing", "checkout", "scalable"] },
      { text: "How would you design a search autocomplete feature?", expectedKeywords: ["trie", "prefix", "ranking", "cache", "debounce", "suggestion"] },
      { text: "Design a ride-sharing service matching system.", expectedKeywords: ["location", "matching", "proximity", "queue", "real-time", "pricing"] },
      { text: "How would you design an API rate limiting system?", expectedKeywords: ["token bucket", "sliding window", "Redis", "distributed", "quota", "response"] },
      { text: "Design a social media feed with infinite scroll.", expectedKeywords: ["pagination", "cursor", "ranking", "cache", "real-time", "preload"] },
      { text: "How would you design a file sharing service like Dropbox?", expectedKeywords: ["chunks", "sync", "storage", "deduplication", "versioning", "conflict"] },
      { text: "Design a real-time leaderboard for an online game.", expectedKeywords: ["sorted set", "Redis", "ranking", "update", "pagination", "score"] },
      { text: "How would you design an email service that handles millions of messages?", expectedKeywords: ["queue", "workers", "bounce", "template", "deliverability", "throttle"] },
    ],
    hard: [
      { text: "Design a real-time collaborative document editor like Google Docs.", expectedKeywords: ["CRDT", "operational transform", "websocket", "conflict", "sync", "concurrent"] },
      { text: "How would you design a video streaming platform like YouTube?", expectedKeywords: ["CDN", "encoding", "transcoding", "storage", "streaming", "recommendation"] },
      { text: "Design a distributed task scheduling system.", expectedKeywords: ["queue", "worker", "priority", "retry", "idempotent", "fault-tolerant"] },
      { text: "How would you design Twitter's trending topics feature?", expectedKeywords: ["stream processing", "counting", "time window", "MapReduce", "real-time", "threshold"] },
      { text: "Design a distributed key-value store like DynamoDB.", expectedKeywords: ["partition", "replication", "consistency", "hashing", "quorum", "failover"] },
      { text: "How would you design a web crawler that indexes billions of pages?", expectedKeywords: ["queue", "distributed", "politeness", "dedup", "priority", "robots.txt"] },
      { text: "Design a payment processing system for an international marketplace.", expectedKeywords: ["idempotent", "transaction", "currency", "reconciliation", "fraud", "gateway"] },
      { text: "How would you design a real-time multiplayer game backend?", expectedKeywords: ["state sync", "latency", "prediction", "authoritative", "UDP", "lobby"] },
      { text: "Design a recommendation engine for an e-commerce platform.", expectedKeywords: ["collaborative filtering", "content-based", "matrix", "real-time", "A/B testing", "cold start"] },
      { text: "How would you design a global CDN from scratch?", expectedKeywords: ["edge", "routing", "cache", "origin", "DNS", "anycast", "invalidation"] },
    ]
  },
  general: {
    easy: [
      { text: "What motivates you in your career?", expectedKeywords: ["growth", "learning", "impact", "challenge", "passion", "goal"] },
      { text: "Where do you see yourself in 5 years?", expectedKeywords: ["growth", "leadership", "skills", "contribute", "develop", "career"] },
      { text: "How do you stay updated with industry trends?", expectedKeywords: ["read", "learn", "community", "conference", "practice", "course"] },
      { text: "What do you know about our company?", expectedKeywords: ["research", "product", "mission", "values", "industry", "growth"] },
      { text: "Why did you choose your current field of study or work?", expectedKeywords: ["passion", "interest", "opportunity", "impact", "enjoy", "curiosity"] },
      { text: "How do you define success in your career?", expectedKeywords: ["impact", "growth", "satisfaction", "contribution", "balance", "goals"] },
      { text: "What are your salary expectations?", expectedKeywords: ["research", "market", "value", "experience", "flexible", "negotiate"] },
      { text: "Do you prefer working independently or in a team?", expectedKeywords: ["both", "collaborate", "independent", "depends", "balance", "communicate"] },
      { text: "What hobbies or interests do you have outside of work?", expectedKeywords: ["balance", "interest", "skill", "creative", "social", "health"] },
      { text: "How would your previous colleagues describe you?", expectedKeywords: ["reliable", "team", "hardworking", "supportive", "positive", "skilled"] },
    ],
    medium: [
      { text: "How do you approach learning a new technology or tool?", expectedKeywords: ["research", "practice", "documentation", "project", "hands-on", "understand"] },
      { text: "Describe your approach to problem-solving.", expectedKeywords: ["analyze", "break down", "research", "solution", "test", "iterate"] },
      { text: "How do you prioritize tasks when everything seems urgent?", expectedKeywords: ["prioritize", "impact", "deadline", "communicate", "delegate", "organize"] },
      { text: "What's your experience with agile development methodologies?", expectedKeywords: ["scrum", "sprint", "standup", "retrospective", "kanban", "iterative"] },
      { text: "How do you handle disagreements about technical approaches?", expectedKeywords: ["data", "discuss", "prototype", "evidence", "compromise", "team"] },
      { text: "Describe your experience with code reviews.", expectedKeywords: ["feedback", "quality", "learn", "standard", "constructive", "improve"] },
      { text: "How do you ensure code quality in your projects?", expectedKeywords: ["testing", "review", "lint", "standards", "documentation", "CI"] },
      { text: "What's your experience working in remote or distributed teams?", expectedKeywords: ["communication", "tools", "timezone", "async", "accountability", "documentation"] },
      { text: "How do you keep up with rapidly changing technologies?", expectedKeywords: ["blog", "newsletter", "community", "project", "course", "experiment"] },
      { text: "Describe a technical decision you made that you later regretted.", expectedKeywords: ["learned", "evaluate", "trade-off", "hindsight", "improved", "adapted"] },
    ],
    hard: [
      { text: "How would you handle a situation where you strongly disagree with a technical decision?", expectedKeywords: ["communicate", "data", "respect", "evidence", "discuss", "professional"] },
      { text: "Describe how you would onboard yourself into a large, unfamiliar codebase.", expectedKeywords: ["documentation", "explore", "ask", "understand", "architecture", "incremental"] },
      { text: "What would you do if you discovered a critical security vulnerability in production?", expectedKeywords: ["report", "immediate", "patch", "communicate", "assess", "document"] },
      { text: "How do you evaluate and choose between competing technologies for a project?", expectedKeywords: ["requirements", "trade-off", "prototype", "team", "ecosystem", "long-term"] },
      { text: "Describe how you approach system debugging when the root cause is unclear.", expectedKeywords: ["logs", "reproduce", "isolate", "hypothesis", "monitoring", "systematic"] },
      { text: "How do you balance technical debt with feature development?", expectedKeywords: ["prioritize", "communicate", "refactor", "metric", "stakeholder", "incremental"] },
      { text: "What strategies do you use to write maintainable and scalable code?", expectedKeywords: ["patterns", "SOLID", "testing", "documentation", "modular", "review"] },
      { text: "How would you convince management to invest in infrastructure improvements?", expectedKeywords: ["ROI", "data", "risk", "metric", "business", "propose", "plan"] },
      { text: "Describe a time when you had to make an architecture decision under uncertainty.", expectedKeywords: ["evaluate", "risk", "reversible", "prototype", "stakeholder", "trade-off"] },
      { text: "How do you approach performance optimization in a production system?", expectedKeywords: ["measure", "profile", "bottleneck", "baseline", "cache", "optimize", "monitor"] },
    ]
  }
};

/**
 * Generate unique interview questions for a session
 * Uses Set to guarantee no duplicate question texts
 */
function generateQuestions(category = 'mixed', difficulty = 'medium', count = 5) {
  const questions = [];
  const usedTexts = new Set();

  if (category === 'mixed') {
    const categories = ['technical', 'behavioral', 'system-design', 'general'];
    // Shuffle categories for variety
    for (let i = categories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [categories[i], categories[j]] = [categories[j], categories[i]];
    }

    for (let i = 0; i < count; i++) {
      const cat = categories[i % categories.length];
      const pool = QUESTION_BANK[cat]?.[difficulty] || QUESTION_BANK[cat]?.['medium'] || [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      
      for (const q of shuffled) {
        if (!usedTexts.has(q.text)) {
          usedTexts.add(q.text);
          questions.push({
            text: q.text,
            order: i,
            category: cat,
            expectedKeywords: q.expectedKeywords
          });
          break;
        }
      }
    }
  } else {
    const pool = QUESTION_BANK[category]?.[difficulty] || QUESTION_BANK[category]?.['medium'] || [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    
    for (const q of shuffled) {
      if (questions.length >= count) break;
      if (!usedTexts.has(q.text)) {
        usedTexts.add(q.text);
        questions.push({
          text: q.text,
          order: questions.length,
          category: category,
          expectedKeywords: q.expectedKeywords
        });
      }
    }
  }

  // Fill remaining slots if needed
  if (questions.length < count) {
    const allPools = Object.values(QUESTION_BANK).flatMap(d => Object.values(d).flat());
    const shuffledAll = [...allPools].sort(() => Math.random() - 0.5);
    for (const q of shuffledAll) {
      if (questions.length >= count) break;
      if (!usedTexts.has(q.text)) {
        usedTexts.add(q.text);
        questions.push({
          text: q.text,
          order: questions.length,
          category: 'general',
          expectedKeywords: q.expectedKeywords
        });
      }
    }
  }

  return questions;
}

/**
 * Basic local analysis (always available, used as fallback)
 */
function localAnalyzeAnswer(answer, expectedKeywords = []) {
  const lowerAnswer = answer.toLowerCase();
  const words = lowerAnswer.split(/\s+/);
  const wordCount = words.length;

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

  const POSITIVE_WORDS = ['achieved', 'accomplished', 'improved', 'successfully', 'effectively', 'collaborated', 'innovative', 'solved', 'implemented', 'developed', 'created', 'designed', 'optimized', 'delivered', 'led', 'managed', 'built', 'enhanced'];
  const WEAK_WORDS = ['maybe', 'perhaps', 'i think', 'i guess', 'not sure', 'kind of', 'sort of', 'probably', 'might', 'um', 'uh', "don't know"];
  const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so yeah', 'i mean'];

  let positiveCount = 0, weakCount = 0, fillerCount = 0;
  for (const w of POSITIVE_WORDS) if (lowerAnswer.includes(w)) positiveCount++;
  for (const w of WEAK_WORDS) if (lowerAnswer.includes(w)) weakCount++;
  for (const f of FILLER_WORDS) {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lowerAnswer.match(regex);
    if (matches) fillerCount += matches.length;
  }

  const sentimentScore = Math.min(10, Math.max(1, 5 + positiveCount - weakCount * 2));
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

  let communicationScore = 5;
  if (wordCount >= 30) communicationScore += 1;
  if (wordCount >= 60) communicationScore += 1;
  if (wordCount >= 100) communicationScore += 1;
  if (fillerRatio < 0.05) communicationScore += 1;
  if (fillerRatio < 0.02) communicationScore += 1;
  communicationScore = Math.min(10, Math.max(1, communicationScore - Math.floor(fillerRatio * 20)));

  let confidenceScore = 5;
  if (weakCount === 0) confidenceScore += 2;
  else if (weakCount <= 1) confidenceScore += 1;
  else confidenceScore -= weakCount;
  if (positiveCount >= 2) confidenceScore += 1;
  if (positiveCount >= 4) confidenceScore += 1;
  if (wordCount >= 50) confidenceScore += 1;
  confidenceScore = Math.min(10, Math.max(1, confidenceScore));

  const overallScore = Math.round((keywordScore * 0.35 + sentimentScore * 0.15 + communicationScore * 0.25 + confidenceScore * 0.25) * 10) / 10;

  return {
    score: overallScore,
    keywordScore: Math.round(keywordScore * 10) / 10,
    communicationScore: Math.round(communicationScore * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 10) / 10,
    feedback: overallScore >= 7 ? 'Good answer with relevant points.' : overallScore >= 4 ? 'Decent answer, could include more detail.' : 'Needs more depth and relevant terminology.',
    matchedKeywords,
    wordCount
  };
}

/**
 * Use Gemini AI to generate the FULL session report with personalized suggestions
 */
async function aiGenerateReport(questions, answers, category, difficulty) {
  const model = initGemini();
  if (!model) return null;

  try {
    // Build Q&A pairs
    const qaPairs = questions.map((q, i) => {
      const ans = answers.find(a => a.questionIndex === i);
      return `Q${i + 1} (${q.category}): ${q.text}\nCandidate Answer: ${ans?.transcript || '(no answer provided)'}`;
    }).join('\n\n');

    const prompt = `You are a senior interview coach and career advisor. Analyze this complete interview session and provide a detailed performance report with actionable improvement suggestions.

Interview Category: ${category}
Difficulty: ${difficulty}
Total Questions: ${questions.length}

=== INTERVIEW TRANSCRIPT ===
${qaPairs}
=== END TRANSCRIPT ===

Provide your analysis as a valid JSON object ONLY (no markdown, no code blocks, no explanation outside JSON):
{
  "overallScore": <number 1-10>,
  "communicationScore": <number 1-10 rating clarity, articulation, structure across all answers>,
  "confidenceScore": <number 1-10 rating assertiveness, conviction, professional tone>,
  "technicalScore": <number 1-10 rating accuracy, depth, domain knowledge>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["specific improvement area 1", "area 2", "area 3"],
  "questionScores": [
    {
      "questionIndex": 0,
      "overall": <number 1-10>,
      "communication": <number 1-10>,
      "confidence": <number 1-10>,
      "technical": <number 1-10>,
      "feedback": "specific feedback for this answer"
    }
  ],
  "aiSuggestions": [
    {
      "title": "short suggestion title",
      "description": "detailed actionable suggestion - 2-3 sentences",
      "priority": "high or medium or low",
      "category": "communication or technical or confidence or preparation"
    }
  ],
  "overallFeedback": "3-4 sentence overall summary of performance and next steps"
}

IMPORTANT RULES:
- questionScores array must have exactly ${questions.length} entries, one per question in order
- aiSuggestions should have 4-6 specific, actionable suggestions tailored to this candidate
- Be honest but constructive
- Tailor suggestions to the ${category} interview context at ${difficulty} difficulty
- If a candidate gave no answer or said "skipped", score that question 1/10
- All scores must be numbers between 1 and 10`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overallScore: Math.min(10, Math.max(0, Number(parsed.overallScore) || 5)),
        communicationScore: Math.min(10, Math.max(0, Number(parsed.communicationScore) || 5)),
        confidenceScore: Math.min(10, Math.max(0, Number(parsed.confidenceScore) || 5)),
        technicalScore: Math.min(10, Math.max(0, Number(parsed.technicalScore) || 5)),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        questionScores: (Array.isArray(parsed.questionScores) ? parsed.questionScores : []).map((qs, i) => ({
          questionIndex: i,
          overall: Math.min(10, Math.max(0, Number(qs.overall) || 5)),
          communication: Math.min(10, Math.max(0, Number(qs.communication) || 5)),
          confidence: Math.min(10, Math.max(0, Number(qs.confidence) || 5)),
          technical: Math.min(10, Math.max(0, Number(qs.technical) || 5)),
          feedback: qs.feedback || ''
        })),
        aiSuggestions: (Array.isArray(parsed.aiSuggestions) ? parsed.aiSuggestions : []).map(s => ({
          title: s.title || '',
          description: s.description || '',
          priority: ['high', 'medium', 'low'].includes(s.priority) ? s.priority : 'medium',
          category: s.category || 'general'
        })),
        overallFeedback: parsed.overallFeedback || ''
      };
    }
  } catch (err) {
    console.error('Gemini report generation failed:', err.message);
  }
  return null;
}

/**
 * Fallback local report generation
 */
function localGenerateReport(questions, answers) {
  const questionScores = [];
  let totalComm = 0, totalConf = 0, totalTech = 0, totalOverall = 0;
  const allStrengths = [], allImprovements = [];

  for (const answer of answers) {
    const question = questions[answer.questionIndex];
    if (!question) continue;
    const analysis = localAnalyzeAnswer(answer.transcript, question.expectedKeywords || []);
    questionScores.push({
      questionIndex: answer.questionIndex,
      overall: analysis.score,
      communication: analysis.communicationScore,
      confidence: analysis.confidenceScore,
      technical: analysis.keywordScore,
      feedback: analysis.feedback
    });
    totalComm += analysis.communicationScore;
    totalConf += analysis.confidenceScore;
    totalTech += analysis.keywordScore;
    totalOverall += analysis.score;

    if (analysis.score >= 7) allStrengths.push(`Strong answer on: "${question.text.substring(0, 50)}..."`);
    if (analysis.communicationScore >= 8) allStrengths.push('Clear and articulate communication');
    if (analysis.score < 5) allImprovements.push(`Review: "${question.text.substring(0, 50)}..."`);
    if (analysis.wordCount < 30) allImprovements.push('Provide more detailed answers');
  }

  const count = answers.length || 1;
  const strengths = [...new Set(allStrengths)].slice(0, 5);
  const improvements = [...new Set(allImprovements)].slice(0, 5);

  return {
    communicationScore: Math.round((totalComm / count) * 10) / 10,
    confidenceScore: Math.round((totalConf / count) * 10) / 10,
    technicalScore: Math.round((totalTech / count) * 10) / 10,
    overallScore: Math.round((totalOverall / count) * 10) / 10,
    strengths: strengths.length > 0 ? strengths : ['Completed the interview session'],
    improvements: improvements.length > 0 ? improvements : ['Continue practicing'],
    questionScores,
    aiSuggestions: [
      { title: 'Practice Regularly', description: 'Schedule mock interviews at least twice a week to build confidence and improve articulation.', priority: 'high', category: 'preparation' },
      { title: 'Use STAR Method', description: 'Structure behavioral answers using Situation, Task, Action, Result for clearer, more impactful responses.', priority: 'high', category: 'communication' },
      { title: 'Expand Technical Vocabulary', description: 'Review key concepts and use precise terminology relevant to your field when answering.', priority: 'medium', category: 'technical' },
      { title: 'Reduce Filler Words', description: 'Practice pausing instead of using filler words like "um", "like", "you know" to sound more confident.', priority: 'medium', category: 'confidence' },
    ],
    overallFeedback: 'Add your Gemini API key in the .env file to get personalized AI-powered analysis and suggestions for each interview session.'
  };
}

/**
 * Main report generator — tries Gemini AI first, falls back to local
 */
async function generateReport(questions, answers, category, difficulty) {
  const aiReport = await aiGenerateReport(questions, answers, category, difficulty);
  if (aiReport) {
    console.log('✅ AI report generated via Gemini');
    return aiReport;
  }
  console.log('⚠️ Falling back to local analysis (configure GEMINI_API_KEY for AI analysis)');
  return localGenerateReport(questions, answers);
}

module.exports = { generateQuestions, generateReport };
