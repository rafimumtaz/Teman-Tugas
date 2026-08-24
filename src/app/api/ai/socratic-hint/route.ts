import { NextRequest, NextResponse } from 'next/server';
import { getGeminiAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { questionTitle, questionBody, subject, currentStep } = await req.json();
    if (!questionTitle && !questionBody) {
      return NextResponse.json({ error: "Question details are required" }, { status: 400 });
    }

    const ai = getGeminiAI();
    const prompt = `You are "TemanTugas Socratic AI Buddy", an encouraging peer mentor for students.
The student is working on this homework problem:
Subject: ${subject || "General"}
Title: ${questionTitle}
Description/Equation: ${questionBody}
Current progress/confusion: ${currentStep || "Starting the problem"}

CRITICAL SOCRATIC RULES:
1. NEVER give the direct final answer or do the homework for them.
2. Break the problem into 2-3 guiding questions or conceptual hints.
3. If there are mathematical formulas, format them cleanly using LaTeX notation or clear ASCII math (e.g. $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).
4. Provide 1 actionable small step the student can try right now on their whiteboard.
5. Keep the tone friendly, encouraging, peer-to-peer (Indonesian + English bilingual friendly, using clear empathetic language).

Return a JSON object with:
- "hintSummary": a 1-sentence friendly guiding thought
- "guidingQuestions": array of 2-3 questions to guide their thinking
- "keyConcept": the key mathematical/scientific principle behind this
- "nextActionableStep": what to write or calculate first on the whiteboard
- "encouragement": short motivating sentence`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        hintSummary: text,
        guidingQuestions: ["What are the known variables?", "Which formula connects these variables?"],
        keyConcept: "Problem Decomposition",
        nextActionableStep: "Write down the given equations on the whiteboard.",
        encouragement: "You've got this! Step by step makes it easy.",
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Socratic hint error:", error);
    return NextResponse.json({
      error: error?.message || "Failed to generate Socratic hint",
      fallback: {
        hintSummary: "Identify your known variables and write down the foundational formula.",
        guidingQuestions: [
          "What variables or constraints are explicitly given in the problem?",
          "Can you break down the equation into simpler sub-expressions?",
        ],
        keyConcept: "Analytical Problem Solving",
        nextActionableStep: "Sketch the problem or write the first step on the interactive whiteboard.",
        encouragement: "Every complex problem is just a series of simple steps.",
      },
    }, { status: 500 });
  }
}
