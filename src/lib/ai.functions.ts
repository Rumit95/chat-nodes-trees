import { createServerFn } from "@tanstack/react-start";

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: { role: "user" | "assistant"; content: string }[] }) => data)
  .handler(async ({ data }) => {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
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
  .inputValidator(
    (data: {
      question: string;
      selectedText: string;
      sourceText?: string;
      conversation?: { role: "user" | "assistant"; content: string }[];
      priorQa?: { question: string; answer: string }[];
    }) => data,
  )
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
