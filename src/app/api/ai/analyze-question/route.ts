import { NextRequest, NextResponse } from 'next/server';
import { getGeminiAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { title, body } = await req.json();
    const ai = getGeminiAI();

    const prompt = `Analyze this student homework question:
Title: ${title}
Body: ${body}

Output JSON with:
- "subject": Best category (e.g., "Matematika", "Fisika", "Kimia", "Informatika / Coding", "Biologi", "Ekonomi", "Bahasa")
- "subTopic": e.g. "Kalkulus Diferensial", "Hukum Newton", "Struktur Data", etc.
- "difficulty": "Mudah" | "Sedang" | "Sulit" | "Olimpiade"
- "suggestedTags": array of 3-5 tags
- "detectedFormulas": array of extracted LaTeX equations if any
- "recommendedBounty": recommended coin bounty (10 to 100)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Failed to analyze question",
      fallback: {
        subject: "Matematika",
        subTopic: "Aljabar & Kalkulus",
        difficulty: "Sedang",
        suggestedTags: ["Matematika", "HomeworkHelp", "StepByStep"],
        detectedFormulas: [],
        recommendedBounty: 25,
      },
    }, { status: 500 });
  }
}
