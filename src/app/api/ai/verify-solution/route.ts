import { NextRequest, NextResponse } from 'next/server';
import { getGeminiAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { question, solution } = await req.json();
    const ai = getGeminiAI();

    const prompt = `Act as an expert peer reviewer for TemanTugas.
Check this student/mentor explanation:
Original Question: ${question}
Proposed Explanation: ${solution}

Output JSON with:
- "isCorrect": boolean
- "clarityScore": number (1 to 10)
- "praise": what is great about the explanation
- "improvementTip": how to make the step-by-step logic even clearer for fellow students
- "suggestedHonorBonus": bonus XP recommended for great pedagogy (10-50)`;

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
      error: error?.message || "Failed to verify solution",
      fallback: {
        isCorrect: true,
        clarityScore: 8,
        praise: "Clear sequential steps and neat presentation.",
        improvementTip: "Consider mentioning edge cases or units if applicable.",
        suggestedHonorBonus: 20,
      },
    }, { status: 500 });
  }
}
