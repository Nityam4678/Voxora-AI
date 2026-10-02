import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is missing from frontend/.env" },
      { status: 500 }
    );
  }

  const { question, pdfBase64 } = await request.json();
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "A question is required" }, { status: 400 });
  }

  const parts: Array<Record<string, unknown>> = [
    {
      text: "Answer the user's question using the attached PDF. Be accurate and concise because the answer will be spoken aloud. If the PDF does not contain the answer, say that clearly.\n\nQuestion: " + question,
    },
  ];

  if (typeof pdfBase64 === "string" && pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  );

  const body = await response.json();
  if (!response.ok) {
    return NextResponse.json(
      { error: body?.error?.message ?? "Gemini request failed" },
      { status: response.status }
    );
  }

  const answer = body?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!answer) {
    return NextResponse.json({ error: "Gemini returned an empty answer" }, { status: 502 });
  }

  return NextResponse.json({ answer });
}
