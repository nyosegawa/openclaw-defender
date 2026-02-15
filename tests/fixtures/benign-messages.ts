/**
 * Benign message fixtures that should NOT trigger any rule.
 */
export const benignMessages: Array<{
  input: string;
  description: string;
}> = [
  {
    input: "Hey, how are you doing today?",
    description: "Simple greeting",
  },
  {
    input: "Can you help me write a Python function to sort a list?",
    description: "Normal coding request",
  },
  {
    input: "What is the capital of France?",
    description: "Simple factual question",
  },
  {
    input: "I read an article about prompt injection attacks and how they work. The concept of tricking an AI by embedding instructions is fascinating from a security perspective.",
    description: "Academic discussion about prompt injection (not malicious)",
  },
  {
    input: "In my code I use `process.exec('npm install')` to install packages. Is there a better way?",
    description: "Code snippet containing exec keyword in benign context",
  },
  {
    input: "The system administrator told me that the server needs a restart. Can you explain how Linux init systems work?",
    description: "Mentions 'system' in benign context",
  },
  {
    input: "Please follow the instructions in the README file to set up the project.",
    description: "Mentions 'instructions' in benign context",
  },
  {
    input: "I need to delete a single file from my git history. What command should I use?",
    description: "Mentions delete in benign git context",
  },
  {
    input: "Can you explain the difference between base64 encoding and base32 encoding? I'm learning about data formats.",
    description: "Mentions base64 in educational context (no long payload)",
  },
  {
    input: "My name is Dan and I work as a software engineer at a startup.",
    description: "Contains 'Dan' as a name (lowercase, not the DAN acronym)",
  },
  {
    input: "\u3053\u3093\u306B\u3061\u306F\u3001\u4ECA\u65E5\u306F\u826F\u3044\u5929\u6C17\u3067\u3059\u306D\u3002",
    description: "Japanese greeting with unicode characters (legitimate use)",
  },
  {
    input: "The new feature is critical for the product launch. We need to prioritize it immediately.",
    description: "Uses 'critical' and 'immediately' in benign business context (no override keywords)",
  },
  {
    input: "I'm building a chatbot and want to understand how system prompts are typically structured. Can you explain the general architecture?",
    description: "Discusses system prompts in educational context",
  },
  {
    input: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    description: "Long Lorem Ipsum text, just normal filler",
  },
  {
    input: "The priority queue implementation uses a binary heap. The role of the comparator function is to determine ordering.",
    description: "Technical discussion using 'priority' and 'role' in benign context",
  },

  // ── Multilingual benign messages ──────────────────────────────

  {
    input: "\u3053\u306e\u6307\u793a\u66f8\u306b\u5f93\u3063\u3066\u4f5c\u696d\u3057\u3066\u304f\u3060\u3055\u3044",
    description: "Japanese: normal business instruction - follow the instruction manual (benign)",
  },
  {
    input: "\u524d\u306e\u4f1a\u8b70\u306e\u8b70\u4e8b\u9332\u3092\u898b\u305b\u3066\u304f\u3060\u3055\u3044",
    description: "Japanese: show meeting notes from previous meeting (benign)",
  },
  {
    input: "\u7cfb\u7edf\u66f4\u65b0\u5b8c\u6210\u4e86",
    description: "Chinese: system update completed (benign)",
  },
  {
    input: "Das System funktioniert gut",
    description: "German: the system works well (benign)",
  },
  {
    input: "Las instrucciones del manual est\u00e1n claras",
    description: "Spanish: the manual instructions are clear (benign)",
  },
  {
    input: "\uc548\ub155\ud558\uc138\uc694, \uc624\ub298 \ub0a0\uc528\uac00 \uc88b\ub124\uc694",
    description: "Korean: hello, nice weather today (benign)",
  },
  {
    input: "\u041f\u0440\u0438\u0432\u0435\u0442, \u043a\u0430\u043a \u0434\u0435\u043b\u0430?",
    description: "Russian: hi, how are you? (benign)",
  },
];
