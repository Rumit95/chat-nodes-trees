import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_OUTPUT_TOKENS = 4096;

// Bring-your-own-key: each request carries the user's chosen provider + key.
// Nothing is stored server-side; the key is used only for this single call.
const PROVIDERS = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-2.0-flash",
  },
} as const;

const aiConfigSchema = z.object({
  provider: z.enum(["openai", "gemini"]),
  apiKey: z.string().min(1).max(400),
});

type AiConfig = z.infer<typeof aiConfigSchema>;

// Calls the user-selected provider with their key and returns the reply text.
async function callProvider(
  config: AiConfig,
  messages: { role: string; content: string }[],
): Promise<string> {
  const provider = PROVIDERS[config.provider];
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages,
    }),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Your API key was rejected. Check it in Settings.");
    }
    if (response.status === 429) {
      throw new Error("Your provider rate limit or quota was reached. Try again later.");
    }
    const text = await response.text();
    throw new Error(`AI request failed (${response.status}): ${text.slice(0, 200)}`);
  }
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected AI response shape");
  }
  return content;
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const chatReplySchema = z.object({
  config: aiConfigSchema,
  messages: z.array(messageSchema).min(1).max(20),
});

const annotationReplySchema = z.object({
  config: aiConfigSchema,
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
    const content = await callProvider(data.config, [
      {
        role: "system",
        content:
          "You are a helpful, concise AI assistant. Keep answers clear and to the point.",
      },
      ...data.messages,
    ]);
    return { content };
  });

export const annotationReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => annotationReplySchema.parse(data))
  .handler(async ({ data }) => {
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
    const content = await callProvider(data.config, [
      {
        role: "system",
        content:
          "You are a helpful assistant answering a follow-up question about a highlighted phrase taken from an AI chat. Always interpret the highlighted phrase in the context of the surrounding passage and conversation provided — do not answer it in isolation or guess an unrelated meaning. Be concise and directly address the question.",
      },
      {
        role: "user",
        content: parts.join("\n\n"),
      },
    ]);
    return { content };
  });
