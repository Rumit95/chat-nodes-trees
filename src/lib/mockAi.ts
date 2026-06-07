// Mocked assistant — produces plausible, varied responses without a backend.

const OPENERS = [
  "Great question. Here's how I'd think about it:",
  "Let's break this down step by step.",
  "There are a few angles worth considering here.",
  "Good point — here's a concise take:",
  "Here's what matters most:",
];

const BODIES = [
  "The core idea is to separate the problem into smaller, well-defined parts so each can be reasoned about independently. This keeps complexity manageable as the system grows.",
  "In practice you'll want to start simple, validate your assumptions early, and only add structure once a real need appears. Premature abstraction tends to cost more than it saves.",
  "Think about the tradeoffs: clarity versus flexibility, speed versus correctness. The right balance depends heavily on the context and who maintains it later.",
  "A useful mental model is to treat data as the source of truth and the UI as a pure projection of that data. Changes flow one direction, which makes behavior predictable.",
  "Patterns are helpful, but they're tools — not rules. Reach for them when they reduce friction, and drop them the moment they start fighting your actual requirements.",
];

const CLOSERS = [
  "Would you like me to go deeper on any part of this?",
  "Let me know if you want a concrete example.",
  "Happy to expand on whichever piece is most relevant.",
  "Want me to compare a couple of alternatives?",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function mockReply(prompt: string): string {
  const trimmed = prompt.trim().slice(0, 120);
  return [
    pick(OPENERS),
    "",
    pick(BODIES),
    "",
    pick(BODIES),
    "",
    `Regarding "${trimmed}" specifically: the key is to stay focused on the outcome you actually need rather than every theoretical edge case.`,
    "",
    pick(CLOSERS),
  ].join("\n");
}

export function mockAnnotationAnswer(question: string, context: string): string {
  return [
    `On "${context.slice(0, 60)}" — ${pick(BODIES)}`,
    "",
    `As for your question, "${question.trim().slice(0, 80)}", ${pick(BODIES).charAt(0).toLowerCase() + pick(BODIES).slice(1)}`,
  ].join("\n");
}