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
  .inputValidator((data: { question: string; context: string }) => data)
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
          {
            role: "system",
            content:
              "You are a helpful assistant answering a specific question about a short piece of text. Be concise and directly address the question.",
          },
          {
            role: "user",
            content: `Text:\n"""${data.context}"""\n\nQuestion: ${data.question}`,
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
