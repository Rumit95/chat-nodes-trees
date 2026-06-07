import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Demo/trial caps — keep AI usage low and predictable.
const MAX_OUTPUT_TOKENS = 400;

// Global daily cap: total AI prompts allowed per day across ALL visitors.
const DAILY_AI_LIMIT = 6;

// Atomically counts this prompt against the global daily quota.
// Returns true if the request is allowed, false if the daily cap is reached.
async function consumeDailyQuota(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_ai_quota", {
    _max: DAILY_AI_LIMIT,
  });
  if (error) {
    throw new Error(`Failed to check daily AI limit: ${error.message}`);
  }
  return data === true;
}

const DAILY_LIMIT_MESSAGE =
  "This demo has reached its daily AI usage limit. Please try again tomorrow.";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const chatReplySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

const annotationReplySchema = z.object({
  question: z.string().min(1).max(1000),
  selectedText: z.string().min(1).max(2000),
  sourceText: z.string().max(4000).optional(),
  conversation: z.array(messageSchema).max(20).optional(),
  priorQa: z
    .array(
      z.object({
        question: z.string().min(1).max(1000),
        answer: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
});

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatReplySchema.parse(data))
  .handler(async ({ data }) => {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!(await consumeDailyQuota())) {
      throw new Error(DAILY_LIMIT_MESSAGE);
    }
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: "You are a helpful, concise AI assistant. Keep answers clear and to the point." },
          ...data.messages,
        ],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Unexpected AI response shape");
    }
    return { content };
  });

export const annotationReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => annotationReplySchema.parse(data))
  .handler(async ({ data }) => {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    const parts: string[] = [];
    if (data.conversation && data.conversation.length) {
      const convo = data.conversation
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
      parts.push(`Conversation so far:\n"""${convo}"""`);
    }
    if (data.sourceText) {
      parts.push(`The full passage the highlight came from:\n"""${data.sourceText}"""`);
    }
    parts.push(`The highlighted phrase the user is asking about:\n"""${data.selectedText}"""`);
    if (data.priorQa && data.priorQa.length) {
      const prior = data.priorQa
        .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
        .join("\n\n");
      parts.push(`Earlier follow-up questions in this thread:\n"""${prior}"""`);
    }
    parts.push(`Question: ${data.question}`);
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant answering a follow-up question about a highlighted phrase taken from an AI chat. Always interpret the highlighted phrase in the context of the surrounding passage and conversation provided — do not answer it in isolation or guess an unrelated meaning. Be concise and directly address the question.",
          },
          {
            role: "user",
            content: parts.join("\n\n"),
          },
        ],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Unexpected AI response shape");
    }
    return { content };
  });
