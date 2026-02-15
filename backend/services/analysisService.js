// ============================================================
// Interview Analysis Service
// Subject-wise questions + Intro question + Gemini AI analysis
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Initialize Gemini ────────────────────────────────────────
let genAI = null;
let geminiModel = null;
let geminiKeyPresent = false;
let lastGeminiError = null; // Track last error reason for better fallback messages

// Model fallback chain — try lighter models first to reduce quota usage
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function initGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === '' || key === 'your-gemini-api-key-here') {
    geminiKeyPresent = false;
    return null;
  }
  geminiKeyPresent = true;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
    geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });
    console.log(`✅ Gemini AI initialized with model: ${GEMINI_MODELS[0]}`);
  }
  return geminiModel;
}

// ============================================================
// INTRODUCTION QUESTIONS — Always asked first
// ============================================================
const INTRO_QUESTIONS = [
  { text: "Tell me about yourself. Give a brief introduction including your background, education, and what you're passionate about.", expectedKeywords: ["name", "education", "background", "experience", "passion", "skills", "career", "goal", "interest", "degree", "college", "university"] },
  { text: "Please introduce yourself. What is your educational background and what are your career goals?", expectedKeywords: ["name", "education", "degree", "career", "goal", "experience", "skills", "interest", "future", "learning"] },
  { text: "Walk me through your background. Where did you study, what technologies or subjects have you learned, and what are you looking for in your next role?", expectedKeywords: ["education", "university", "skills", "technology", "role", "looking for", "experience", "projects", "learning"] },
];

// ============================================================
// SUBJECT-WISE QUESTION BANK
// Categories: dsa, dbms, cpp, python, webdev, behavioral, system-design, general
// Each category has easy/medium/hard with 15+ questions
// ============================================================
const QUESTION_BANK = {
  // ─── Data Structures & Algorithms ──────────────────────────
  dsa: {
    easy: [
      { text: "What is an array and how is it different from a linked list?", expectedKeywords: ["contiguous", "memory", "index", "node", "pointer", "access", "insertion", "deletion", "dynamic", "static"] },
      { text: "Explain what a stack is and give a real-world example.", expectedKeywords: ["LIFO", "push", "pop", "top", "undo", "function call", "recursion", "plates"] },
      { text: "What is a queue and where is it used?", expectedKeywords: ["FIFO", "enqueue", "dequeue", "front", "rear", "printer", "BFS", "scheduling"] },
      { text: "What is the difference between linear search and binary search?", expectedKeywords: ["sequential", "sorted", "O(n)", "O(log n)", "mid", "divide", "unsorted", "compare"] },
      { text: "Explain what a linked list is and its types.", expectedKeywords: ["node", "next", "pointer", "singly", "doubly", "circular", "head", "tail", "traversal"] },
      { text: "What is time complexity and why is it important?", expectedKeywords: ["Big O", "efficiency", "input size", "worst case", "best case", "performance", "algorithm"] },
      { text: "What is the difference between a tree and a graph?", expectedKeywords: ["hierarchy", "root", "child", "parent", "cycle", "edge", "vertex", "node", "connected"] },
      { text: "Explain bubble sort and its time complexity.", expectedKeywords: ["compare", "swap", "adjacent", "O(n²)", "simple", "inefficient", "pass", "sorted"] },
      { text: "What is a hash table and how does it work?", expectedKeywords: ["key", "value", "hash function", "bucket", "collision", "O(1)", "lookup", "mapping"] },
      { text: "What is recursion? Give a simple example.", expectedKeywords: ["base case", "function calls itself", "factorial", "fibonacci", "stack", "termination", "recursive"] },
      { text: "What is the difference between a stack and a queue?", expectedKeywords: ["LIFO", "FIFO", "push", "pop", "enqueue", "dequeue", "order", "usage"] },
      { text: "Explain what a binary tree is.", expectedKeywords: ["node", "left", "right", "child", "root", "leaf", "two children", "subtree"] },
      { text: "What is the purpose of sorting algorithms?", expectedKeywords: ["order", "arrange", "search", "efficient", "ascending", "descending", "organize", "data"] },
      { text: "What is space complexity?", expectedKeywords: ["memory", "space", "auxiliary", "input", "Big O", "extra space", "in-place", "usage"] },
      { text: "What are the basic operations on a linked list?", expectedKeywords: ["insert", "delete", "traverse", "search", "head", "node", "pointer", "update"] },
    ],
    medium: [
      { text: "Explain Binary Search Tree (BST) and its operations.", expectedKeywords: ["left", "right", "smaller", "greater", "insert", "search", "delete", "in-order", "O(log n)"] },
      { text: "What is the difference between BFS and DFS? When would you use each?", expectedKeywords: ["breadth", "depth", "queue", "stack", "level", "shortest path", "traversal", "graph"] },
      { text: "Explain merge sort and why it's preferred over bubble sort.", expectedKeywords: ["divide", "conquer", "merge", "O(n log n)", "stable", "recursive", "efficient", "split"] },
      { text: "What is a heap and how is it used in priority queues?", expectedKeywords: ["min-heap", "max-heap", "complete binary tree", "priority", "extract", "insert", "heapify"] },
      { text: "Explain the concept of dynamic programming with an example.", expectedKeywords: ["overlapping subproblems", "optimal substructure", "memoization", "tabulation", "fibonacci", "bottom-up", "top-down"] },
      { text: "What is a hash map collision and how do you handle it?", expectedKeywords: ["chaining", "open addressing", "linear probing", "linked list", "hash function", "rehash", "load factor"] },
      { text: "Explain the quicksort algorithm and its average time complexity.", expectedKeywords: ["pivot", "partition", "divide", "conquer", "O(n log n)", "in-place", "recursive", "worst case O(n²)"] },
      { text: "What is a balanced binary tree and why is balancing important?", expectedKeywords: ["AVL", "height", "rotation", "O(log n)", "skewed", "performance", "balanced", "red-black"] },
      { text: "Describe the two-pointer technique and give an example problem.", expectedKeywords: ["start", "end", "converge", "sorted array", "O(n)", "pair sum", "efficient", "pointer"] },
      { text: "What is a graph adjacency list vs adjacency matrix?", expectedKeywords: ["space", "edge", "vertex", "sparse", "dense", "O(V+E)", "O(V²)", "representation"] },
      { text: "Explain the sliding window technique.", expectedKeywords: ["window", "fixed", "variable", "subarray", "substring", "maximum", "minimum", "O(n)"] },
      { text: "What is topological sorting and when is it used?", expectedKeywords: ["DAG", "directed acyclic", "dependency", "order", "DFS", "in-degree", "scheduling", "prerequisite"] },
      { text: "Explain Dijkstra's shortest path algorithm.", expectedKeywords: ["greedy", "weighted", "shortest", "priority queue", "relaxation", "non-negative", "distance", "vertex"] },
      { text: "What is backtracking? Give an example.", expectedKeywords: ["explore", "constraint", "undo", "recursive", "N-queens", "sudoku", "decision tree", "pruning"] },
      { text: "Explain the difference between greedy and dynamic programming approaches.", expectedKeywords: ["local optimal", "global optimal", "subproblem", "overlapping", "greedy choice", "memoization"] },
    ],
    hard: [
      { text: "Explain Red-Black Trees and when to use them over AVL trees.", expectedKeywords: ["self-balancing", "color", "rotation", "insert", "delete", "O(log n)", "constraints", "AVL stricter"] },
      { text: "What is a Trie data structure and where is it used?", expectedKeywords: ["prefix", "tree", "character", "autocomplete", "dictionary", "search", "word", "node"] },
      { text: "Explain the A* search algorithm and how it differs from Dijkstra's.", expectedKeywords: ["heuristic", "f(n)", "g(n)", "h(n)", "admissible", "optimal", "informed", "priority queue"] },
      { text: "What is a segment tree and when would you use it?", expectedKeywords: ["range query", "update", "interval", "O(log n)", "lazy propagation", "sum", "minimum", "maximum"] },
      { text: "Explain the Knapsack problem and its DP solution.", expectedKeywords: ["weight", "value", "capacity", "0/1", "bounded", "unbounded", "table", "optimal"] },
      { text: "What are Bloom Filters and where are they used?", expectedKeywords: ["probabilistic", "false positive", "hash functions", "bit array", "membership", "space efficient", "no false negative"] },
      { text: "Explain the concept of amortized analysis.", expectedKeywords: ["average", "worst case", "sequence", "dynamic array", "aggregate", "accounting", "potential"] },
      { text: "Describe the Floyd-Warshall algorithm for all-pairs shortest paths.", expectedKeywords: ["dynamic programming", "intermediate", "O(V³)", "matrix", "negative weights", "all pairs", "distance"] },
      { text: "What is a disjoint set (Union-Find) and path compression?", expectedKeywords: ["union", "find", "parent", "rank", "path compression", "connected components", "cycle detection"] },
      { text: "Explain the difference between P, NP, and NP-complete problems.", expectedKeywords: ["polynomial", "non-deterministic", "verifiable", "reducible", "hard", "traveling salesman", "SAT"] },
      { text: "What is a B-Tree and why is it used in databases?", expectedKeywords: ["balanced", "multi-way", "disk", "block", "order", "range queries", "index", "node"] },
      { text: "Explain Kruskal's and Prim's algorithms for minimum spanning trees.", expectedKeywords: ["MST", "greedy", "edge", "weight", "sort", "union-find", "priority queue", "connected"] },
      { text: "What is the Longest Common Subsequence problem? Explain the DP approach.", expectedKeywords: ["subsequence", "table", "match", "diagonal", "O(mn)", "string", "comparison", "optimal"] },
      { text: "How do you detect a cycle in a directed graph?", expectedKeywords: ["DFS", "visited", "recursion stack", "back edge", "topological sort", "coloring", "cycle"] },
      { text: "Explain consistent hashing and its use in distributed systems.", expectedKeywords: ["ring", "virtual nodes", "rebalance", "partition", "hash space", "minimal disruption", "load balancing"] },
    ]
  },

  // ─── DBMS ──────────────────────────────────────────────────
  dbms: {
    easy: [
      { text: "What is a database and why do we need a DBMS?", expectedKeywords: ["data", "store", "manage", "organized", "redundancy", "security", "integrity", "query"] },
      { text: "What is the difference between a primary key and a foreign key?", expectedKeywords: ["unique", "identify", "reference", "relationship", "table", "constraint", "null", "parent"] },
      { text: "Explain what SQL is and name some common SQL commands.", expectedKeywords: ["structured query", "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "database", "query"] },
      { text: "What is normalization in databases?", expectedKeywords: ["redundancy", "anomaly", "1NF", "2NF", "3NF", "decompose", "dependency", "organize"] },
      { text: "What are the different types of SQL joins?", expectedKeywords: ["INNER", "LEFT", "RIGHT", "FULL", "CROSS", "tables", "match", "combine"] },
      { text: "What is a transaction in a database?", expectedKeywords: ["ACID", "atomicity", "consistency", "isolation", "durability", "commit", "rollback", "unit"] },
      { text: "Explain the difference between WHERE and HAVING clauses.", expectedKeywords: ["filter", "rows", "groups", "aggregate", "GROUP BY", "condition", "before", "after"] },
      { text: "What is an ER diagram?", expectedKeywords: ["entity", "relationship", "attribute", "cardinality", "diagram", "design", "schema", "mapping"] },
      { text: "What is the difference between CHAR and VARCHAR data types?", expectedKeywords: ["fixed", "variable", "length", "storage", "padding", "space", "character", "size"] },
      { text: "What is indexing in a database?", expectedKeywords: ["fast", "lookup", "B-tree", "pointer", "performance", "search", "column", "query speed"] },
      { text: "What are aggregate functions in SQL?", expectedKeywords: ["COUNT", "SUM", "AVG", "MAX", "MIN", "GROUP BY", "calculate", "result"] },
      { text: "What is a view in SQL?", expectedKeywords: ["virtual table", "query", "stored", "security", "simplify", "derived", "base table"] },
      { text: "What is the difference between DELETE, TRUNCATE, and DROP?", expectedKeywords: ["delete rows", "remove all", "drop table", "rollback", "structure", "data", "DDL", "DML"] },
      { text: "What are constraints in a database?", expectedKeywords: ["NOT NULL", "UNIQUE", "PRIMARY KEY", "FOREIGN KEY", "CHECK", "DEFAULT", "rule", "integrity"] },
      { text: "Explain the concept of a schema in a database.", expectedKeywords: ["structure", "definition", "tables", "columns", "relationships", "blueprint", "logical", "design"] },
    ],
    medium: [
      { text: "Explain ACID properties with examples.", expectedKeywords: ["atomicity", "consistency", "isolation", "durability", "transaction", "bank transfer", "crash", "commit"] },
      { text: "What is denormalization and when would you use it?", expectedKeywords: ["redundancy", "performance", "read-heavy", "join", "trade-off", "speed", "normalize", "reporting"] },
      { text: "Explain the different types of database indexing.", expectedKeywords: ["B-tree", "hash", "bitmap", "clustered", "non-clustered", "composite", "covering", "unique"] },
      { text: "What is a stored procedure and how is it different from a function?", expectedKeywords: ["precompiled", "SQL", "parameters", "return", "execute", "reusable", "performance", "encapsulate"] },
      { text: "Explain the concept of database triggers.", expectedKeywords: ["event", "automatic", "INSERT", "UPDATE", "DELETE", "BEFORE", "AFTER", "action"] },
      { text: "What are isolation levels in a database transaction?", expectedKeywords: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE", "dirty read", "phantom", "lock"] },
      { text: "Explain the difference between OLTP and OLAP.", expectedKeywords: ["transaction", "analytical", "real-time", "historical", "normalized", "denormalized", "insert", "query"] },
      { text: "What is a deadlock in a database? How do you prevent it?", expectedKeywords: ["circular wait", "lock", "two transactions", "timeout", "detection", "prevention", "resource ordering"] },
      { text: "Explain query optimization techniques.", expectedKeywords: ["index", "explain plan", "avoid SELECT *", "join order", "subquery", "cache", "partitioning", "statistics"] },
      { text: "What is referential integrity?", expectedKeywords: ["foreign key", "parent", "child", "cascade", "restrict", "set null", "relationship", "consistent"] },
      { text: "Explain the difference between correlated and non-correlated subqueries.", expectedKeywords: ["inner query", "outer query", "dependent", "independent", "execution", "row by row", "once"] },
      { text: "What is database partitioning?", expectedKeywords: ["horizontal", "vertical", "range", "hash", "list", "performance", "large tables", "manageability"] },
      { text: "What are window functions in SQL?", expectedKeywords: ["OVER", "PARTITION BY", "ROW_NUMBER", "RANK", "DENSE_RANK", "LAG", "LEAD", "aggregate"] },
      { text: "Explain the concept of database replication.", expectedKeywords: ["master", "slave", "synchronous", "asynchronous", "availability", "failover", "consistency", "read replica"] },
      { text: "What is a cursor in SQL?", expectedKeywords: ["row by row", "fetch", "declare", "open", "close", "processing", "loop", "result set"] },
    ],
    hard: [
      { text: "Explain the CAP theorem and its impact on database design.", expectedKeywords: ["consistency", "availability", "partition tolerance", "distributed", "trade-off", "eventual consistency", "CP", "AP"] },
      { text: "What is Multi-Version Concurrency Control (MVCC)?", expectedKeywords: ["version", "snapshot", "isolation", "read", "write", "timestamp", "conflict", "PostgreSQL"] },
      { text: "Explain database sharding strategies and challenges.", expectedKeywords: ["horizontal partition", "shard key", "range", "hash", "cross-shard", "rebalancing", "consistent hashing"] },
      { text: "What is the two-phase commit protocol?", expectedKeywords: ["prepare", "commit", "coordinator", "participant", "distributed", "atomicity", "abort", "acknowledge"] },
      { text: "Explain the differences between Pessimistic and Optimistic locking.", expectedKeywords: ["lock before", "check after", "conflict", "read-heavy", "write-heavy", "version", "concurrency"] },
      { text: "How do columnar databases differ from row-based databases?", expectedKeywords: ["column-oriented", "row-oriented", "analytics", "compression", "aggregation", "write", "read", "OLAP"] },
      { text: "What is the write-ahead log (WAL) in databases?", expectedKeywords: ["log", "recovery", "crash", "durability", "sequential", "buffer", "checkpoint", "redo"] },
      { text: "Explain eventual consistency and its trade-offs.", expectedKeywords: ["CAP", "availability", "latency", "converge", "stale read", "distributed", "conflict resolution"] },
      { text: "What is a materialized view and when would you use it?", expectedKeywords: ["precomputed", "refresh", "performance", "complex query", "trade-off", "storage", "stale data"] },
      { text: "Explain the Raft consensus algorithm.", expectedKeywords: ["leader", "follower", "candidate", "election", "log replication", "majority", "term", "distributed"] },
    ]
  },

  // ─── C/C++ Programming ─────────────────────────────────────
  cpp: {
    easy: [
      { text: "What is the difference between C and C++?", expectedKeywords: ["object-oriented", "procedural", "class", "encapsulation", "inheritance", "C with classes", "features"] },
      { text: "What are pointers in C/C++?", expectedKeywords: ["address", "memory", "dereference", "variable", "asterisk", "ampersand", "NULL", "pointer arithmetic"] },
      { text: "Explain the difference between call by value and call by reference.", expectedKeywords: ["copy", "address", "original", "modify", "parameter", "pointer", "reference", "function"] },
      { text: "What is the difference between struct and class in C++?", expectedKeywords: ["default access", "public", "private", "inheritance", "struct public", "class private", "data"] },
      { text: "What are header files in C/C++?", expectedKeywords: ["declaration", "#include", "function prototype", "macro", "reusable", "preprocessor", ".h", "library"] },
      { text: "Explain what a constructor and destructor are in C++.", expectedKeywords: ["initialize", "create", "destroy", "cleanup", "automatic", "same name", "class", "memory"] },
      { text: "What is the difference between malloc and new in C++?", expectedKeywords: ["C function", "operator", "constructor", "type-safe", "returns void*", "returns typed", "free", "delete"] },
      { text: "What is a reference variable in C++?", expectedKeywords: ["alias", "alternative name", "no NULL", "must initialize", "no reassignment", "reference", "address"] },
      { text: "Explain the difference between while and do-while loops.", expectedKeywords: ["condition first", "execute first", "at least once", "entry controlled", "exit controlled", "loop"] },
      { text: "What is function overloading in C++?", expectedKeywords: ["same name", "different parameters", "compile time", "polymorphism", "type", "number", "signature"] },
      { text: "What are arrays and strings in C?", expectedKeywords: ["contiguous", "index", "character array", "null terminated", "\\0", "fixed size", "elements"] },
      { text: "What is the use of the 'const' keyword in C++?", expectedKeywords: ["constant", "cannot modify", "read-only", "function", "pointer", "parameter", "safety"] },
      { text: "Explain static variables in C/C++.", expectedKeywords: ["lifetime", "initialized once", "retains value", "scope", "function", "file", "global", "default zero"] },
      { text: "What is the difference between == and = in C/C++?", expectedKeywords: ["assignment", "comparison", "equality check", "value", "operator", "condition", "bug"] },
      { text: "What is a namespace in C++?", expectedKeywords: ["scope", "name collision", "std", "using", "organize", "grouping", "declaration"] },
    ],
    medium: [
      { text: "Explain the four pillars of OOP in C++ with examples.", expectedKeywords: ["encapsulation", "inheritance", "polymorphism", "abstraction", "class", "virtual", "access specifier"] },
      { text: "What is virtual function and how does it enable runtime polymorphism?", expectedKeywords: ["virtual", "vtable", "override", "base class", "derived class", "pointer", "dynamic binding", "late binding"] },
      { text: "Explain the concept of templates in C++.", expectedKeywords: ["generic", "type parameter", "function template", "class template", "compile time", "reusable", "typename"] },
      { text: "What is operator overloading? Give an example.", expectedKeywords: ["custom behavior", "operator", "+", "<<", "class", "object", "member function", "friend"] },
      { text: "Explain smart pointers in C++ (unique_ptr, shared_ptr, weak_ptr).", expectedKeywords: ["RAII", "automatic", "ownership", "memory leak", "unique_ptr", "shared_ptr", "reference count", "weak_ptr"] },
      { text: "What is the difference between shallow copy and deep copy?", expectedKeywords: ["pointer", "copy values", "copy pointed data", "copy constructor", "assignment", "heap", "new memory"] },
      { text: "Explain the concept of inheritance types in C++.", expectedKeywords: ["single", "multiple", "multilevel", "hierarchical", "hybrid", "diamond problem", "virtual inheritance"] },
      { text: "What are exception handling mechanisms in C++?", expectedKeywords: ["try", "catch", "throw", "exception", "stack unwinding", "std::exception", "custom exception"] },
      { text: "Explain the STL (Standard Template Library) containers.", expectedKeywords: ["vector", "list", "map", "set", "deque", "stack", "queue", "iterator", "algorithm"] },
      { text: "What is the difference between compile-time and runtime polymorphism?", expectedKeywords: ["overloading", "overriding", "static binding", "dynamic binding", "virtual", "template", "early", "late"] },
      { text: "Explain the Rule of Three / Rule of Five in C++.", expectedKeywords: ["destructor", "copy constructor", "copy assignment", "move constructor", "move assignment", "resource management"] },
      { text: "What is a friend function and friend class?", expectedKeywords: ["access", "private", "protected", "non-member", "declaration", "class", "encapsulation", "trust"] },
      { text: "Explain memory management in C++ (stack vs heap).", expectedKeywords: ["stack", "heap", "new", "delete", "automatic", "dynamic", "memory leak", "scope"] },
      { text: "What are lambda expressions in C++?", expectedKeywords: ["anonymous", "function", "capture", "closure", "syntax", "inline", "auto", "functor"] },
      { text: "Explain the concept of abstract class and pure virtual function.", expectedKeywords: ["= 0", "cannot instantiate", "interface", "derived class", "must override", "abstract", "base class"] },
    ],
    hard: [
      { text: "Explain move semantics and rvalue references in C++11.", expectedKeywords: ["&&", "std::move", "transfer", "resource", "temporary", "efficiency", "move constructor", "copy elision"] },
      { text: "What is SFINAE in C++ templates?", expectedKeywords: ["substitution failure", "overload resolution", "enable_if", "type traits", "compile time", "template", "SFINAE"] },
      { text: "Explain the memory layout of a C++ object with virtual functions.", expectedKeywords: ["vtable", "vptr", "text segment", "data segment", "stack", "heap", "virtual pointer", "layout"] },
      { text: "What is CRTP (Curiously Recurring Template Pattern)?", expectedKeywords: ["static polymorphism", "base", "derived", "template parameter", "compile time", "performance", "no vtable"] },
      { text: "Explain the concurrency features in C++11/14/17.", expectedKeywords: ["thread", "mutex", "async", "future", "promise", "condition_variable", "atomic", "lock_guard"] },
      { text: "What are design patterns commonly used in C++?", expectedKeywords: ["singleton", "factory", "observer", "strategy", "adapter", "RAII", "pattern", "GoF"] },
      { text: "Explain the difference between static and dynamic linking.", expectedKeywords: ["compile time", "runtime", "library", ".a", ".so", ".dll", "executable size", "dependency"] },
      { text: "What is undefined behavior in C++ and how to avoid it?", expectedKeywords: ["dangling pointer", "buffer overflow", "uninitialized", "race condition", "sequence point", "compiler", "UB"] },
      { text: "Explain template metaprogramming in C++.", expectedKeywords: ["compile-time", "computation", "specialization", "recursive", "constexpr", "type traits", "Turing complete"] },
      { text: "What is the pimpl idiom (Pointer to Implementation)?", expectedKeywords: ["compilation firewall", "forward declaration", "binary compatibility", "unique_ptr", "implementation hiding", "ABI"] },
    ]
  },

  // ─── Python Programming ────────────────────────────────────
  python: {
    easy: [
      { text: "What are the key features of Python?", expectedKeywords: ["interpreted", "dynamic", "easy syntax", "object-oriented", "indentation", "high-level", "readable"] },
      { text: "What is the difference between a list and a tuple in Python?", expectedKeywords: ["mutable", "immutable", "square brackets", "parentheses", "modify", "fixed", "performance"] },
      { text: "Explain what a dictionary is in Python.", expectedKeywords: ["key-value", "unordered", "mutable", "lookup", "hash", "curly braces", "O(1)", "mapping"] },
      { text: "What are Python decorators?", expectedKeywords: ["function", "wrapper", "@", "modify behavior", "higher-order", "reusable", "syntax sugar"] },
      { text: "What is the difference between '==' and 'is' in Python?", expectedKeywords: ["value equality", "identity", "object", "same memory", "compare", "id()", "reference"] },
      { text: "Explain list comprehension in Python.", expectedKeywords: ["concise", "one line", "for loop", "filter", "expression", "list", "readable", "Pythonic"] },
      { text: "What is PEP 8?", expectedKeywords: ["style guide", "coding standards", "indentation", "naming conventions", "readability", "best practices", "Python"] },
      { text: "What is the difference between Python 2 and Python 3?", expectedKeywords: ["print function", "division", "unicode", "range", "syntax", "end of life", "migration"] },
      { text: "Explain the concept of indentation in Python.", expectedKeywords: ["whitespace", "block", "scope", "mandatory", "4 spaces", "tab", "syntax error", "structure"] },
      { text: "What are Python modules and packages?", expectedKeywords: ["import", "file", "directory", "__init__", "reusable", "organize", "code", "library"] },
      { text: "What is the 'self' keyword in Python?", expectedKeywords: ["instance", "class", "method", "object", "reference", "first parameter", "convention"] },
      { text: "Explain the basic data types in Python.", expectedKeywords: ["int", "float", "str", "bool", "list", "tuple", "dict", "set", "None"] },
      { text: "What is exception handling in Python?", expectedKeywords: ["try", "except", "finally", "raise", "error", "handle", "catch", "exception"] },
      { text: "What are f-strings in Python?", expectedKeywords: ["formatted", "string", "expression", "curly braces", "3.6", "readable", "interpolation", "f\"\""] },
      { text: "How do you read and write files in Python?", expectedKeywords: ["open", "read", "write", "close", "with", "context manager", "mode", "r", "w", "a"] },
    ],
    medium: [
      { text: "Explain generators and the yield keyword in Python.", expectedKeywords: ["lazy", "iterator", "yield", "memory efficient", "next()", "generator function", "state", "on demand"] },
      { text: "What is the GIL (Global Interpreter Lock) in Python?", expectedKeywords: ["thread", "CPython", "single thread", "lock", "concurrency", "multiprocessing", "limitation", "bytecode"] },
      { text: "Explain the difference between *args and **kwargs.", expectedKeywords: ["positional", "keyword", "variable arguments", "tuple", "dictionary", "unpack", "flexible", "function"] },
      { text: "What are Python's magic/dunder methods?", expectedKeywords: ["__init__", "__str__", "__repr__", "__len__", "__add__", "special", "double underscore", "operator overloading"] },
      { text: "Explain the concept of closures in Python.", expectedKeywords: ["nested function", "enclosing scope", "free variable", "remember", "state", "function factory", "nonlocal"] },
      { text: "What is the difference between deep copy and shallow copy?", expectedKeywords: ["copy module", "nested objects", "deepcopy", "reference", "independent", "recursive copy", "shared"] },
      { text: "Explain Python's garbage collection mechanism.", expectedKeywords: ["reference counting", "generational", "cyclic", "gc module", "collect", "del", "memory management"] },
      { text: "What is a context manager and how do you create one?", expectedKeywords: ["with statement", "__enter__", "__exit__", "resource management", "contextlib", "cleanup", "file handling"] },
      { text: "Explain multiprocessing vs multithreading in Python.", expectedKeywords: ["GIL", "CPU-bound", "I/O-bound", "process", "thread", "parallel", "concurrent", "Pool"] },
      { text: "What are abstract base classes in Python?", expectedKeywords: ["ABC", "abstractmethod", "cannot instantiate", "interface", "contract", "inheritance", "abc module"] },
      { text: "Explain Python decorators with arguments.", expectedKeywords: ["wrapper", "nested function", "factory", "arguments", "@decorator(args)", "functools.wraps", "closure"] },
      { text: "What is monkey patching in Python?", expectedKeywords: ["runtime", "modify", "class", "module", "dynamic", "attribute", "testing", "dangerous"] },
      { text: "Explain the MRO (Method Resolution Order) in Python.", expectedKeywords: ["C3 linearization", "diamond problem", "inheritance", "mro()", "super()", "order", "multiple inheritance"] },
      { text: "What are slots in Python classes?", expectedKeywords: ["__slots__", "memory", "fixed attributes", "no __dict__", "fast access", "optimization", "restrict"] },
      { text: "Explain async/await in Python.", expectedKeywords: ["asyncio", "coroutine", "event loop", "non-blocking", "concurrent", "await", "async def", "I/O"] },
    ],
    hard: [
      { text: "Explain Python metaclasses and their use cases.", expectedKeywords: ["type", "class of class", "__new__", "__init__", "control creation", "ORM", "validation", "metaclass="] },
      { text: "How does Python's memory management work internally?", expectedKeywords: ["PyObject", "reference counting", "memory pool", "arena", "generational GC", "obmalloc", "private heap"] },
      { text: "Explain descriptor protocol in Python.", expectedKeywords: ["__get__", "__set__", "__delete__", "data descriptor", "non-data descriptor", "property", "attribute access"] },
      { text: "What are coroutines and how do they differ from generators?", expectedKeywords: ["send", "await", "bidirectional", "async", "event loop", "cooperative", "yield from", "concurrent"] },
      { text: "Explain the CPython internals for function calls.", expectedKeywords: ["frame object", "bytecode", "stack", "code object", "local variables", "CALL_FUNCTION", "ceval.c"] },
      { text: "What is the import system in Python and how does it work?", expectedKeywords: ["sys.path", "finder", "loader", "importlib", "__import__", "sys.modules", "cache", "meta_path"] },
      { text: "Explain type hints and static type checking in Python.", expectedKeywords: ["typing", "mypy", "annotation", "Generic", "Protocol", "TypeVar", "Union", "Optional"] },
      { text: "How would you optimize a Python application for performance?", expectedKeywords: ["profiling", "cProfile", "C extension", "Cython", "multiprocessing", "numpy", "algorithm", "cache"] },
      { text: "Explain the data model and attribute lookup in Python.", expectedKeywords: ["__getattr__", "__getattribute__", "descriptor", "MRO", "__dict__", "class hierarchy", "lookup chain"] },
      { text: "What are design patterns commonly used in Python?", expectedKeywords: ["singleton", "factory", "observer", "strategy", "decorator", "iterator", "Pythonic", "pattern"] },
    ]
  },

  // ─── Web Development ───────────────────────────────────────
  webdev: {
    easy: [
      { text: "What is the difference between HTML, CSS, and JavaScript?", expectedKeywords: ["structure", "style", "behavior", "markup", "stylesheet", "programming", "webpage", "content"] },
      { text: "What is the DOM and how does JavaScript interact with it?", expectedKeywords: ["Document Object Model", "tree", "elements", "getElementById", "querySelector", "manipulate", "browser"] },
      { text: "Explain the difference between GET and POST HTTP methods.", expectedKeywords: ["retrieve", "send", "URL", "body", "idempotent", "data", "form", "request"] },
      { text: "What is responsive web design?", expectedKeywords: ["media queries", "flexible", "mobile", "viewport", "breakpoints", "grid", "layout", "screen size"] },
      { text: "What is a REST API?", expectedKeywords: ["representational state transfer", "endpoint", "HTTP methods", "stateless", "resource", "JSON", "CRUD", "URL"] },
      { text: "Explain what CSS Flexbox is and when to use it.", expectedKeywords: ["layout", "one-dimensional", "flex container", "flex items", "justify-content", "align-items", "direction", "responsive"] },
      { text: "What is the difference between localStorage and sessionStorage?", expectedKeywords: ["persistent", "session", "browser", "tab", "key-value", "5MB", "storage", "expires"] },
      { text: "What is a cookie and what is it used for?", expectedKeywords: ["small data", "browser", "server", "session", "authentication", "tracking", "expiry", "HTTP header"] },
      { text: "Explain what a single-page application (SPA) is.", expectedKeywords: ["one page", "dynamic", "no reload", "client-side", "routing", "JavaScript", "React", "fast"] },
      { text: "What is Bootstrap and why is it used?", expectedKeywords: ["CSS framework", "responsive", "grid", "components", "pre-built", "mobile-first", "classes", "rapid development"] },
      { text: "What is the difference between inline, block, and inline-block elements?", expectedKeywords: ["flow", "line", "full width", "width/height", "span", "div", "display", "layout"] },
      { text: "What is JSON and why is it used in web development?", expectedKeywords: ["JavaScript Object Notation", "data format", "lightweight", "API", "parse", "stringify", "key-value", "exchange"] },
      { text: "Explain what a web server is.", expectedKeywords: ["HTTP", "request", "response", "host", "Apache", "Nginx", "Node.js", "client-server"] },
      { text: "What are semantic HTML tags?", expectedKeywords: ["meaning", "header", "nav", "article", "section", "footer", "accessibility", "SEO", "structure"] },
      { text: "What is version control and how does Git work?", expectedKeywords: ["track changes", "commit", "branch", "merge", "repository", "clone", "push", "pull"] },
    ],
    medium: [
      { text: "Explain the concept of virtual DOM in React.", expectedKeywords: ["performance", "diffing", "reconciliation", "real DOM", "update", "batch", "component", "render"] },
      { text: "What is CORS and why is it important?", expectedKeywords: ["Cross-Origin", "browser", "security", "policy", "headers", "Access-Control", "preflight", "allow"] },
      { text: "Explain the concept of middleware in Express.js.", expectedKeywords: ["request", "response", "next", "pipeline", "authentication", "logging", "error handling", "function"] },
      { text: "What is the difference between SQL and NoSQL databases?", expectedKeywords: ["relational", "document", "schema", "flexible", "table", "collection", "ACID", "scalability"] },
      { text: "Explain how authentication with JWT works in web applications.", expectedKeywords: ["token", "header", "payload", "signature", "stateless", "Bearer", "localStorage", "verify"] },
      { text: "What is the difference between SSR and CSR?", expectedKeywords: ["server-side rendering", "client-side rendering", "SEO", "performance", "initial load", "interactive", "React", "Next.js"] },
      { text: "Explain the concept of state management in React.", expectedKeywords: ["useState", "useReducer", "Context", "Redux", "props", "re-render", "global state", "local state"] },
      { text: "What is Webpack and why is it used?", expectedKeywords: ["bundler", "modules", "loader", "plugin", "entry", "output", "optimization", "build"] },
      { text: "Explain CSS Grid and how it differs from Flexbox.", expectedKeywords: ["two-dimensional", "rows", "columns", "grid-template", "fr", "gap", "layout", "complex"] },
      { text: "What are WebSockets and when would you use them?", expectedKeywords: ["bidirectional", "real-time", "persistent", "full-duplex", "chat", "gaming", "event", "connection"] },
      { text: "Explain the React component lifecycle.", expectedKeywords: ["mount", "update", "unmount", "useEffect", "render", "state change", "props change", "cleanup"] },
      { text: "What is a Progressive Web App (PWA)?", expectedKeywords: ["offline", "service worker", "manifest", "installable", "push notification", "responsive", "app-like", "cache"] },
      { text: "Explain RESTful API design best practices.", expectedKeywords: ["resource naming", "HTTP status codes", "versioning", "pagination", "filtering", "HATEOAS", "idempotent"] },
      { text: "What is TypeScript and why would you use it over JavaScript?", expectedKeywords: ["typed", "compile-time", "interface", "error detection", "IDE support", "transpile", "safety", "scalable"] },
      { text: "Explain the concept of hooks in React.", expectedKeywords: ["useState", "useEffect", "useContext", "useRef", "custom hook", "functional component", "rules", "state"] },
    ],
    hard: [
      { text: "Explain micro-frontend architecture.", expectedKeywords: ["independent", "team", "deploy", "framework agnostic", "composition", "Module Federation", "isolation", "scalable"] },
      { text: "How would you optimize a web application for performance?", expectedKeywords: ["lazy loading", "code splitting", "CDN", "caching", "minify", "compression", "tree shaking", "lighthouse"] },
      { text: "Explain how the browser renders a web page from HTML to pixels.", expectedKeywords: ["DOM tree", "CSSOM", "render tree", "layout", "paint", "composite", "critical rendering path"] },
      { text: "What are Web Workers and how do they work?", expectedKeywords: ["background thread", "main thread", "postMessage", "heavy computation", "dedicated", "shared", "parallel"] },
      { text: "Explain the event loop in Node.js in detail.", expectedKeywords: ["call stack", "callback queue", "microtask", "macrotask", "libuv", "phases", "I/O", "non-blocking"] },
      { text: "How would you implement a real-time collaborative feature?", expectedKeywords: ["WebSocket", "CRDT", "operational transform", "conflict resolution", "sync", "cursor", "awareness"] },
      { text: "Explain GraphQL and its advantages over REST.", expectedKeywords: ["query language", "schema", "resolver", "overfetching", "underfetching", "mutation", "subscription", "type system"] },
      { text: "What is server-side rendering with hydration?", expectedKeywords: ["HTML server", "React hydrate", "interactive", "SEO", "performance", "initial state", "bundle", "Next.js"] },
      { text: "Explain containerization with Docker for web applications.", expectedKeywords: ["image", "container", "Dockerfile", "compose", "isolate", "deploy", "port mapping", "volume"] },
      { text: "How do you implement CI/CD for a web application?", expectedKeywords: ["pipeline", "testing", "build", "deploy", "GitHub Actions", "automated", "staging", "production"] },
    ]
  },

  // ─── Behavioral ────────────────────────────────────────────
  behavioral: {
    easy: [
      { text: "Why are you interested in this position?", expectedKeywords: ["growth", "opportunity", "skills", "company", "challenge", "contribution", "align"] },
      { text: "How do you handle stress at work?", expectedKeywords: ["prioritize", "manage", "calm", "organize", "communicate", "focus", "break"] },
      { text: "Describe your ideal work environment.", expectedKeywords: ["collaborative", "supportive", "growth", "communication", "flexible", "team", "productive"] },
      { text: "What are your greatest professional strengths?", expectedKeywords: ["skill", "ability", "example", "strength", "demonstrate", "impact", "consistency"] },
      { text: "How do you manage your time and stay organized?", expectedKeywords: ["calendar", "priority", "tasks", "deadline", "plan", "tools", "schedule"] },
      { text: "What type of work culture do you thrive in?", expectedKeywords: ["team", "autonomy", "feedback", "open", "innovative", "structured", "collaborative"] },
      { text: "Describe a project you are most proud of.", expectedKeywords: ["challenge", "solution", "team", "result", "impact", "learned", "contribution"] },
      { text: "How do you approach working with a new team?", expectedKeywords: ["introduce", "listen", "learn", "contribute", "adapt", "communicate", "observe"] },
      { text: "What motivates you to do your best work?", expectedKeywords: ["impact", "growth", "challenge", "purpose", "recognition", "learning", "passion"] },
      { text: "How do you handle feedback from your manager?", expectedKeywords: ["listen", "improve", "open", "constructive", "implement", "grow", "reflect"] },
      { text: "Describe a time when you went above and beyond at work.", expectedKeywords: ["initiative", "extra", "impact", "team", "result", "dedication", "effort"] },
      { text: "What do you consider your biggest professional weakness?", expectedKeywords: ["honest", "improve", "aware", "working on", "steps", "growth", "self-awareness"] },
      { text: "How do you stay motivated during repetitive tasks?", expectedKeywords: ["goal", "music", "break", "focus", "improve process", "routine", "purpose"] },
      { text: "Tell me about a time you helped a colleague succeed.", expectedKeywords: ["support", "mentor", "share", "team", "help", "teach", "empathy"] },
      { text: "How do you handle working under a tight deadline?", expectedKeywords: ["prioritize", "plan", "communicate", "focus", "efficient", "delegate", "manage"] },
    ],
    medium: [
      { text: "Tell me about a time you had to deal with a difficult team member.", expectedKeywords: ["communication", "conflict", "resolution", "listen", "compromise", "professional", "empathy"] },
      { text: "Describe a situation where you had to meet a tight deadline.", expectedKeywords: ["prioritize", "organize", "plan", "communicate", "deliver", "pressure", "manage"] },
      { text: "Give an example of a time you showed leadership.", expectedKeywords: ["initiative", "guide", "team", "decision", "responsibility", "motivate", "lead"] },
      { text: "Tell me about a time you failed and what you learned from it.", expectedKeywords: ["mistake", "learn", "improve", "reflect", "grow", "adapt", "takeaway"] },
      { text: "How do you handle receiving constructive criticism?", expectedKeywords: ["feedback", "improve", "open", "listen", "learn", "change", "grateful"] },
      { text: "Describe a time you had to learn something quickly to complete a task.", expectedKeywords: ["research", "practice", "adapt", "resourceful", "deadline", "discipline", "self-learning"] },
      { text: "Tell me about a time you disagreed with your manager.", expectedKeywords: ["respectful", "data", "discuss", "compromise", "professional", "outcome", "approach"] },
      { text: "Give an example of when you had to multitask effectively.", expectedKeywords: ["prioritize", "organize", "delegate", "focus", "manage", "efficient", "balance"] },
      { text: "Describe a situation where you had to persuade others to accept your idea.", expectedKeywords: ["data", "presentation", "listen", "evidence", "compromise", "stakeholder", "convince"] },
      { text: "Tell me about a time you worked with a diverse team.", expectedKeywords: ["respect", "perspective", "inclusive", "collaborate", "learn", "cultural", "open-minded"] },
      { text: "Describe a challenging problem you solved creatively.", expectedKeywords: ["analyze", "approach", "creative", "solution", "thinking", "unconventional", "innovative"] },
      { text: "How have you handled a situation where requirements changed mid-project?", expectedKeywords: ["adapt", "communicate", "flexible", "reprioritize", "scope", "stakeholder", "agile"] },
      { text: "Tell me about a time you had to deliver bad news to a stakeholder.", expectedKeywords: ["honest", "transparent", "empathy", "solution", "proactive", "plan", "professional"] },
      { text: "Describe how you've mentored or trained a junior colleague.", expectedKeywords: ["teach", "patient", "example", "guide", "feedback", "growth", "support"] },
      { text: "Give an example of when you took ownership of a mistake.", expectedKeywords: ["accountability", "honest", "fix", "learn", "prevent", "responsible", "integrity"] },
    ],
    hard: [
      { text: "Describe a situation where you had to make a decision with incomplete information.", expectedKeywords: ["analyze", "risk", "judgment", "data", "decision", "uncertain", "outcome"] },
      { text: "Tell me about a time you had to influence stakeholders who disagreed with your approach.", expectedKeywords: ["persuade", "data", "communicate", "compromise", "evidence", "alignment", "strategy"] },
      { text: "Describe a complex project you managed from start to finish.", expectedKeywords: ["plan", "execute", "coordinate", "milestone", "challenge", "deliver", "result"] },
      { text: "Tell me about a time you had to adapt to a major organizational change.", expectedKeywords: ["adapt", "flexible", "change", "resilient", "positive", "learn", "embrace"] },
      { text: "How would you handle a team member who is consistently underperforming?", expectedKeywords: ["communicate", "understand", "support", "expectations", "plan", "documentation", "empathy"] },
      { text: "Describe a time when you had to balance competing priorities from different stakeholders.", expectedKeywords: ["negotiate", "prioritize", "transparent", "impact", "communicate", "trade-off", "alignment"] },
      { text: "Tell me about a time you identified and mitigated a significant risk.", expectedKeywords: ["assess", "proactive", "plan", "contingency", "monitor", "communicate", "prevent"] },
      { text: "How have you driven innovation within your team or organization?", expectedKeywords: ["propose", "experiment", "data", "pilot", "culture", "improvement", "initiative"] },
      { text: "Describe a situation where you had to make an unpopular decision.", expectedKeywords: ["rationale", "communicate", "data", "courage", "outcome", "transparent", "conviction"] },
      { text: "Tell me about navigating a situation with ambiguous or conflicting goals.", expectedKeywords: ["clarify", "align", "stakeholder", "prioritize", "communicate", "compromise", "resolve"] },
    ]
  },

  // ─── System Design ─────────────────────────────────────────
  'system-design': {
    easy: [
      { text: "How would you design a URL shortening service like bit.ly?", expectedKeywords: ["hash", "database", "redirect", "unique", "encode", "store", "base62"] },
      { text: "Design a basic chat application.", expectedKeywords: ["websocket", "real-time", "message", "user", "room", "store", "notification"] },
      { text: "How would you design a simple file storage system?", expectedKeywords: ["upload", "download", "metadata", "storage", "access", "organize", "permission"] },
      { text: "Design a basic user authentication system.", expectedKeywords: ["password", "hash", "session", "token", "login", "register", "secure", "bcrypt"] },
      { text: "How would you design a simple blogging platform?", expectedKeywords: ["CRUD", "posts", "users", "comments", "database", "categories", "frontend"] },
      { text: "Design a basic to-do list application backend.", expectedKeywords: ["CRUD", "user", "tasks", "status", "priority", "database", "API"] },
      { text: "How would you design a simple polling/voting system?", expectedKeywords: ["options", "votes", "results", "unique", "prevent duplicate", "real-time", "database"] },
      { text: "Design a contact form backend with email notifications.", expectedKeywords: ["validate", "store", "email", "queue", "spam", "template", "notification"] },
      { text: "How would you design a basic image gallery application?", expectedKeywords: ["upload", "thumbnail", "storage", "metadata", "album", "resize", "CDN"] },
      { text: "Design a simple event booking system.", expectedKeywords: ["events", "tickets", "capacity", "booking", "confirmation", "availability", "payment"] },
    ],
    medium: [
      { text: "Design a notification system for a social media platform.", expectedKeywords: ["push", "queue", "real-time", "preference", "batch", "priority", "channels"] },
      { text: "How would you design a caching layer for a web application?", expectedKeywords: ["Redis", "TTL", "invalidation", "hit rate", "eviction", "LRU", "cache aside"] },
      { text: "Design an e-commerce shopping cart system.", expectedKeywords: ["session", "database", "inventory", "pricing", "checkout", "scalable", "payment"] },
      { text: "How would you design a search autocomplete feature?", expectedKeywords: ["trie", "prefix", "ranking", "cache", "debounce", "suggestion", "Elasticsearch"] },
      { text: "Design a ride-sharing service matching system.", expectedKeywords: ["location", "matching", "proximity", "queue", "real-time", "pricing", "geospatial"] },
      { text: "How would you design an API rate limiting system?", expectedKeywords: ["token bucket", "sliding window", "Redis", "distributed", "quota", "response", "throttle"] },
      { text: "Design a social media feed with infinite scroll.", expectedKeywords: ["pagination", "cursor", "ranking", "cache", "real-time", "preload", "algorithm"] },
      { text: "How would you design a file sharing service like Dropbox?", expectedKeywords: ["chunks", "sync", "storage", "deduplication", "versioning", "conflict", "metadata"] },
      { text: "Design a real-time leaderboard for an online game.", expectedKeywords: ["sorted set", "Redis", "ranking", "update", "pagination", "score", "cache"] },
      { text: "How would you design an email service that handles millions of messages?", expectedKeywords: ["queue", "workers", "bounce", "template", "deliverability", "throttle", "async"] },
    ],
    hard: [
      { text: "Design a real-time collaborative document editor like Google Docs.", expectedKeywords: ["CRDT", "operational transform", "websocket", "conflict", "sync", "concurrent", "cursor"] },
      { text: "How would you design a video streaming platform like YouTube?", expectedKeywords: ["CDN", "encoding", "transcoding", "storage", "streaming", "recommendation", "adaptive bitrate"] },
      { text: "Design a distributed task scheduling system.", expectedKeywords: ["queue", "worker", "priority", "retry", "idempotent", "fault-tolerant", "cron"] },
      { text: "How would you design Twitter's trending topics feature?", expectedKeywords: ["stream processing", "counting", "time window", "MapReduce", "real-time", "threshold", "decay"] },
      { text: "Design a distributed key-value store like DynamoDB.", expectedKeywords: ["partition", "replication", "consistency", "hashing", "quorum", "failover", "eventual"] },
      { text: "How would you design a web crawler that indexes billions of pages?", expectedKeywords: ["queue", "distributed", "politeness", "dedup", "priority", "robots.txt", "parsing"] },
      { text: "Design a payment processing system for an international marketplace.", expectedKeywords: ["idempotent", "transaction", "currency", "reconciliation", "fraud", "gateway", "PCI"] },
      { text: "How would you design a real-time multiplayer game backend?", expectedKeywords: ["state sync", "latency", "prediction", "authoritative", "UDP", "lobby", "tick rate"] },
      { text: "Design a recommendation engine for an e-commerce platform.", expectedKeywords: ["collaborative filtering", "content-based", "matrix", "real-time", "A/B testing", "cold start", "ML"] },
      { text: "How would you design a global CDN from scratch?", expectedKeywords: ["edge", "routing", "cache", "origin", "DNS", "anycast", "invalidation", "PoP"] },
    ]
  },

  // ─── General / HR ──────────────────────────────────────────
  general: {
    easy: [
      { text: "What motivates you in your career?", expectedKeywords: ["growth", "learning", "impact", "challenge", "passion", "goal", "purpose"] },
      { text: "Where do you see yourself in 5 years?", expectedKeywords: ["growth", "leadership", "skills", "contribute", "develop", "career", "vision"] },
      { text: "How do you stay updated with industry trends?", expectedKeywords: ["read", "learn", "community", "conference", "practice", "course", "blog"] },
      { text: "What do you know about our company?", expectedKeywords: ["research", "product", "mission", "values", "industry", "growth", "culture"] },
      { text: "Why did you choose your current field of study or work?", expectedKeywords: ["passion", "interest", "opportunity", "impact", "enjoy", "curiosity", "career"] },
      { text: "How do you define success in your career?", expectedKeywords: ["impact", "growth", "satisfaction", "contribution", "balance", "goals", "value"] },
      { text: "What are your salary expectations?", expectedKeywords: ["research", "market", "value", "experience", "flexible", "negotiate", "fair"] },
      { text: "Do you prefer working independently or in a team?", expectedKeywords: ["both", "collaborate", "independent", "depends", "balance", "communicate", "flexible"] },
      { text: "What hobbies or interests do you have outside of work?", expectedKeywords: ["balance", "interest", "skill", "creative", "social", "health", "learning"] },
      { text: "How would your previous colleagues describe you?", expectedKeywords: ["reliable", "team", "hardworking", "supportive", "positive", "skilled", "dedicated"] },
    ],
    medium: [
      { text: "How do you approach learning a new technology or tool?", expectedKeywords: ["research", "practice", "documentation", "project", "hands-on", "understand", "experiment"] },
      { text: "Describe your approach to problem-solving.", expectedKeywords: ["analyze", "break down", "research", "solution", "test", "iterate", "systematic"] },
      { text: "How do you prioritize tasks when everything seems urgent?", expectedKeywords: ["prioritize", "impact", "deadline", "communicate", "delegate", "organize", "matrix"] },
      { text: "What's your experience with agile development methodologies?", expectedKeywords: ["scrum", "sprint", "standup", "retrospective", "kanban", "iterative", "backlog"] },
      { text: "How do you handle disagreements about technical approaches?", expectedKeywords: ["data", "discuss", "prototype", "evidence", "compromise", "team", "respect"] },
      { text: "Describe your experience with code reviews.", expectedKeywords: ["feedback", "quality", "learn", "standard", "constructive", "improve", "best practices"] },
      { text: "How do you ensure code quality in your projects?", expectedKeywords: ["testing", "review", "lint", "standards", "documentation", "CI", "automation"] },
      { text: "What's your experience working in remote or distributed teams?", expectedKeywords: ["communication", "tools", "timezone", "async", "accountability", "documentation", "video call"] },
      { text: "How do you keep up with rapidly changing technologies?", expectedKeywords: ["blog", "newsletter", "community", "project", "course", "experiment", "podcast"] },
      { text: "Describe a technical decision you made that you later regretted.", expectedKeywords: ["learned", "evaluate", "trade-off", "hindsight", "improved", "adapted", "lesson"] },
    ],
    hard: [
      { text: "How would you handle a situation where you strongly disagree with a technical decision?", expectedKeywords: ["communicate", "data", "respect", "evidence", "discuss", "professional", "compromise"] },
      { text: "Describe how you would onboard yourself into a large, unfamiliar codebase.", expectedKeywords: ["documentation", "explore", "ask", "understand", "architecture", "incremental", "mentor"] },
      { text: "What would you do if you discovered a critical security vulnerability in production?", expectedKeywords: ["report", "immediate", "patch", "communicate", "assess", "document", "incident"] },
      { text: "How do you evaluate and choose between competing technologies for a project?", expectedKeywords: ["requirements", "trade-off", "prototype", "team", "ecosystem", "long-term", "benchmark"] },
      { text: "Describe how you approach system debugging when the root cause is unclear.", expectedKeywords: ["logs", "reproduce", "isolate", "hypothesis", "monitoring", "systematic", "binary search"] },
      { text: "How do you balance technical debt with feature development?", expectedKeywords: ["prioritize", "communicate", "refactor", "metric", "stakeholder", "incremental", "plan"] },
      { text: "What strategies do you use to write maintainable and scalable code?", expectedKeywords: ["patterns", "SOLID", "testing", "documentation", "modular", "review", "clean code"] },
      { text: "How would you convince management to invest in infrastructure improvements?", expectedKeywords: ["ROI", "data", "risk", "metric", "business", "propose", "plan", "impact"] },
      { text: "Describe a time when you had to make an architecture decision under uncertainty.", expectedKeywords: ["evaluate", "risk", "reversible", "prototype", "stakeholder", "trade-off", "document"] },
      { text: "How do you approach performance optimization in a production system?", expectedKeywords: ["measure", "profile", "bottleneck", "baseline", "cache", "optimize", "monitor", "metrics"] },
    ]
  }
};

// ============================================================
// Generate unique interview questions for a session
// ALWAYS starts with an introduction question
// ============================================================
function generateQuestions(category = 'mixed', difficulty = 'medium', count = 5) {
  const questions = [];
  const usedTexts = new Set();

  // ── 1. ALWAYS add an intro question first ──────────────────
  const introQ = INTRO_QUESTIONS[Math.floor(Math.random() * INTRO_QUESTIONS.length)];
  questions.push({
    text: introQ.text,
    order: 0,
    category: 'introduction',
    expectedKeywords: introQ.expectedKeywords
  });
  usedTexts.add(introQ.text);

  // ── 2. Fill remaining slots with category questions ────────
  const remaining = count - 1;

  if (category === 'mixed') {
    const categories = Object.keys(QUESTION_BANK);
    for (let i = categories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [categories[i], categories[j]] = [categories[j], categories[i]];
    }

    for (let i = 0; i < remaining; i++) {
      const cat = categories[i % categories.length];
      const pool = QUESTION_BANK[cat]?.[difficulty] || QUESTION_BANK[cat]?.['medium'] || [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);

      for (const q of shuffled) {
        if (!usedTexts.has(q.text)) {
          usedTexts.add(q.text);
          questions.push({
            text: q.text,
            order: questions.length,
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

  // Fill remaining slots from any available pool
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

// ============================================================
// Local answer analysis — STRICT scoring for empty/skipped
// ============================================================
function localAnalyzeAnswer(answer, expectedKeywords = []) {
  const lowerAnswer = (answer || '').toLowerCase().trim();

  // ── Handle empty/skipped/no answer ─────────────────────────
  if (!lowerAnswer || lowerAnswer === '(skipped)' || lowerAnswer === 'skipped' || lowerAnswer.length < 5) {
    return {
      score: 1,
      keywordScore: 0,
      communicationScore: 1,
      confidenceScore: 1,
      feedback: 'No answer was provided. You must attempt every question to get a meaningful score.',
      matchedKeywords: [],
      wordCount: 0
    };
  }

  const words = lowerAnswer.split(/\s+/);
  const wordCount = words.length;

  // Very short answers (< 10 words) get penalized heavily
  if (wordCount < 10) {
    return {
      score: 2,
      keywordScore: 1,
      communicationScore: 2,
      confidenceScore: 2,
      feedback: 'Your answer is too brief. Provide detailed explanations with examples to score well.',
      matchedKeywords: [],
      wordCount
    };
  }

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
    ? Math.round((keywordsFound / expectedKeywords.length) * 10 * 10) / 10
    : 5;

  // Sentiment analysis
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

  // Communication
  let communicationScore = 3; // start lower — must earn it
  if (wordCount >= 20) communicationScore += 1;
  if (wordCount >= 40) communicationScore += 1;
  if (wordCount >= 60) communicationScore += 1;
  if (wordCount >= 100) communicationScore += 1;
  if (fillerRatio < 0.05) communicationScore += 1;
  if (fillerRatio < 0.02) communicationScore += 1;
  communicationScore = Math.min(10, Math.max(1, communicationScore - Math.floor(fillerRatio * 20)));

  // Confidence
  let confidenceScore = 3; // start lower
  if (weakCount === 0) confidenceScore += 2;
  else if (weakCount <= 1) confidenceScore += 1;
  else confidenceScore -= weakCount;
  if (positiveCount >= 2) confidenceScore += 1;
  if (positiveCount >= 4) confidenceScore += 1;
  if (wordCount >= 40) confidenceScore += 1;
  if (wordCount >= 80) confidenceScore += 1;
  confidenceScore = Math.min(10, Math.max(1, confidenceScore));

  const overallScore = Math.round((keywordScore * 0.35 + sentimentScore * 0.15 + communicationScore * 0.25 + confidenceScore * 0.25) * 10) / 10;

  let feedback;
  if (overallScore >= 8) feedback = 'Excellent answer with strong depth, relevant terminology, and clear structure.';
  else if (overallScore >= 6) feedback = 'Good answer. Could be stronger with more specific examples and technical details.';
  else if (overallScore >= 4) feedback = 'Decent attempt but needs more depth, relevant keywords, and structured explanation.';
  else feedback = 'Weak answer. Review the topic and practice explaining it clearly with examples.';

  return { score: overallScore, keywordScore, communicationScore, confidenceScore, feedback, matchedKeywords, wordCount };
}

// ============================================================
// Gemini AI report generation
// ============================================================
async function aiGenerateReport(questions, answers, category, difficulty) {
  const model = initGemini();
  if (!model) return null;

  try {
    const qaPairs = questions.map((q, i) => {
      const ans = answers.find(a => a.questionIndex === i);
      const transcript = ans?.transcript || '(no answer provided)';
      const wasSkipped = !ans || transcript === '(skipped)' || transcript.trim().length < 5;
      return `Q${i + 1} [${q.category}]: ${q.text}\nCandidate's Answer: ${wasSkipped ? '(DID NOT ANSWER / SKIPPED)' : transcript}`;
    }).join('\n\n');

    const prompt = `You are a strict but fair senior interview coach. Analyze this interview session and give HONEST scores. Do NOT inflate scores.

CRITICAL SCORING RULES:
- If a candidate SKIPPED a question or gave NO ANSWER, that question MUST be scored 1/10 on ALL dimensions
- Very short answers (under 15 words) should score 2-3/10
- Mediocre answers with no depth should score 4-5/10
- Good answers with some depth should score 6-7/10
- Excellent, detailed answers with examples should score 8-9/10
- Perfect, comprehensive answers score 10/10 (very rare)
- The overall scores should REFLECT the actual quality — if most answers were skipped, overall must be 1-2/10

Interview Category: ${category}
Difficulty Level: ${difficulty}
Total Questions: ${questions.length}

=== INTERVIEW TRANSCRIPT ===
${qaPairs}
=== END TRANSCRIPT ===

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "overallScore": <number 1-10>,
  "communicationScore": <number 1-10>,
  "confidenceScore": <number 1-10>,
  "technicalScore": <number 1-10>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
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
      "title": "short title",
      "description": "2-3 sentence actionable advice",
      "priority": "high|medium|low",
      "category": "communication|technical|confidence|preparation"
    }
  ],
  "overallFeedback": "3-4 sentence honest summary"
}

Rules:
- questionScores must have exactly ${questions.length} entries in order
- aiSuggestions should have 4-6 items
- Be honest — do NOT give high scores for empty or poor answers
- If candidate skipped all questions, overall score should be 1`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Gemini returned non-JSON response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      overallScore: Math.min(10, Math.max(1, Number(parsed.overallScore) || 1)),
      communicationScore: Math.min(10, Math.max(1, Number(parsed.communicationScore) || 1)),
      confidenceScore: Math.min(10, Math.max(1, Number(parsed.confidenceScore) || 1)),
      technicalScore: Math.min(10, Math.max(1, Number(parsed.technicalScore) || 1)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      questionScores: (Array.isArray(parsed.questionScores) ? parsed.questionScores : []).map((qs, i) => ({
        questionIndex: i,
        overall: Math.min(10, Math.max(1, Number(qs.overall) || 1)),
        communication: Math.min(10, Math.max(1, Number(qs.communication) || 1)),
        confidence: Math.min(10, Math.max(1, Number(qs.confidence) || 1)),
        technical: Math.min(10, Math.max(1, Number(qs.technical) || 1)),
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
  } catch (err) {
    const isQuotaError = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    const isRateLimit = err.message?.includes('429') || err.message?.includes('rate');

    if (isQuotaError || isRateLimit) {
      console.error('⚠️ Gemini quota/rate limit exceeded. Trying fallback models...');
      lastGeminiError = 'quota_exceeded';

      // Try fallback models
      for (let m = 1; m < GEMINI_MODELS.length; m++) {
        try {
          console.log(`🔄 Trying fallback model: ${GEMINI_MODELS[m]}`);
          const fallbackModel = genAI.getGenerativeModel({ model: GEMINI_MODELS[m] });
          const result = await fallbackModel.generateContent(prompt);
          const text = result.response.text().trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`✅ Fallback model ${GEMINI_MODELS[m]} succeeded!`);
          lastGeminiError = null;
          return {
            overallScore: Math.min(10, Math.max(1, Number(parsed.overallScore) || 1)),
            communicationScore: Math.min(10, Math.max(1, Number(parsed.communicationScore) || 1)),
            confidenceScore: Math.min(10, Math.max(1, Number(parsed.confidenceScore) || 1)),
            technicalScore: Math.min(10, Math.max(1, Number(parsed.technicalScore) || 1)),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
            questionScores: (Array.isArray(parsed.questionScores) ? parsed.questionScores : []).map((qs, i) => ({
              questionIndex: i,
              overall: Math.min(10, Math.max(1, Number(qs.overall) || 1)),
              communication: Math.min(10, Math.max(1, Number(qs.communication) || 1)),
              confidence: Math.min(10, Math.max(1, Number(qs.confidence) || 1)),
              technical: Math.min(10, Math.max(1, Number(qs.technical) || 1)),
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
        } catch (fallbackErr) {
          console.error(`❌ Fallback model ${GEMINI_MODELS[m]} also failed:`, fallbackErr.message);
        }
      }

      // All models failed — try once more after a short delay
      try {
        console.log('⏳ Waiting 5 seconds before retrying primary model...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        const retryModel = genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });
        const result = await retryModel.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Retry after delay succeeded!');
          lastGeminiError = null;
          return {
            overallScore: Math.min(10, Math.max(1, Number(parsed.overallScore) || 1)),
            communicationScore: Math.min(10, Math.max(1, Number(parsed.communicationScore) || 1)),
            confidenceScore: Math.min(10, Math.max(1, Number(parsed.confidenceScore) || 1)),
            technicalScore: Math.min(10, Math.max(1, Number(parsed.technicalScore) || 1)),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
            questionScores: (Array.isArray(parsed.questionScores) ? parsed.questionScores : []).map((qs, i) => ({
              questionIndex: i,
              overall: Math.min(10, Math.max(1, Number(qs.overall) || 1)),
              communication: Math.min(10, Math.max(1, Number(qs.communication) || 1)),
              confidence: Math.min(10, Math.max(1, Number(qs.confidence) || 1)),
              technical: Math.min(10, Math.max(1, Number(qs.technical) || 1)),
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
      } catch (retryErr) {
        console.error('❌ Retry after delay also failed:', retryErr.message);
      }
    } else {
      console.error('❌ Gemini report generation failed:', err.message);
      lastGeminiError = 'api_error';
    }
    return null;
  }
}

// ============================================================
// Fallback local report — STRICT scoring
// ============================================================
function localGenerateReport(questions, answers) {
  const questionScores = [];
  let totalComm = 0, totalConf = 0, totalTech = 0, totalOverall = 0;
  const allStrengths = [], allImprovements = [];
  let answeredCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answer = answers.find(a => a.questionIndex === i);
    const transcript = answer?.transcript || '';

    const analysis = localAnalyzeAnswer(transcript, question.expectedKeywords || []);
    questionScores.push({
      questionIndex: i,
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

    if (analysis.wordCount > 10) answeredCount++;

    if (analysis.score >= 7) allStrengths.push(`Strong answer on: "${question.text.substring(0, 60)}..."`);
    if (analysis.communicationScore >= 8) allStrengths.push('Clear and articulate communication');
    if (analysis.score < 3) allImprovements.push(`Study and practice: "${question.text.substring(0, 60)}..."`);
    if (analysis.wordCount < 15 && analysis.wordCount > 0) allImprovements.push('Provide much more detailed answers with examples');
    if (analysis.wordCount === 0) allImprovements.push('Do not skip questions — attempt every one');
  }

  const count = questions.length || 1;
  const strengths = [...new Set(allStrengths)].slice(0, 5);
  const improvements = [...new Set(allImprovements)].slice(0, 5);

  return {
    communicationScore: Math.round((totalComm / count) * 10) / 10,
    confidenceScore: Math.round((totalConf / count) * 10) / 10,
    technicalScore: Math.round((totalTech / count) * 10) / 10,
    overallScore: Math.round((totalOverall / count) * 10) / 10,
    strengths: strengths.length > 0 ? strengths : ['Attempted the interview session'],
    improvements: improvements.length > 0 ? improvements : ['Continue practicing regularly'],
    questionScores,
    aiSuggestions: [
      { title: 'Practice Regularly', description: 'Schedule mock interviews at least twice a week to build confidence and improve articulation.', priority: 'high', category: 'preparation' },
      { title: 'Use STAR Method', description: 'Structure behavioral answers using Situation, Task, Action, Result for clearer, more impactful responses.', priority: 'high', category: 'communication' },
      { title: 'Study Core Concepts', description: 'Review fundamentals of your chosen subject area — DSA, DBMS, OOP — and practice explaining them out loud.', priority: 'medium', category: 'technical' },
      { title: 'Reduce Filler Words', description: 'Practice pausing instead of using filler words like "um", "like", "you know" to sound more confident.', priority: 'medium', category: 'confidence' },
    ],
    overallFeedback: answeredCount === 0
      ? 'You did not answer any questions in this session. Please attempt all questions to receive a meaningful analysis.'
      : `You answered ${answeredCount} out of ${count} questions. ${answeredCount < count ? 'Try to attempt every question for a complete evaluation.' : 'Good job attempting all questions!'} ${lastGeminiError === 'quota_exceeded' ? 'Note: Gemini AI quota is temporarily exceeded. This analysis was generated locally. AI-powered feedback will resume when quota resets.' : !geminiKeyPresent ? 'Configure your Gemini API key in .env for AI-powered feedback.' : 'This analysis was generated using local evaluation.'}`
  };
}

// ============================================================
// Main report generator — Gemini first, local fallback
// ============================================================
async function generateReport(questions, answers, category, difficulty) {
  // Attempt Gemini AI analysis
  const aiReport = await aiGenerateReport(questions, answers, category, difficulty);
  if (aiReport) {
    console.log('✅ AI report generated via Gemini');
    return aiReport;
  }
  if (!geminiKeyPresent) {
    console.log('⚠️ Falling back to local analysis — no GEMINI_API_KEY in .env');
  } else {
    console.log('⚠️ Falling back to local analysis — Gemini API error (quota or other issue)');
  }
  return localGenerateReport(questions, answers);
}

module.exports = { generateQuestions, generateReport };
