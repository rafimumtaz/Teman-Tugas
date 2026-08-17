import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "TemanTugas", timestamp: Date.now() });
});

// Socratic AI Homework Assistant Endpoint
app.post("/api/ai/socratic-hint", async (req, res) => {
  try {
    const { questionTitle, questionBody, subject, currentStep } = req.body;
    if (!questionTitle && !questionBody) {
      return res.status(400).json({ error: "Question details are required" });
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

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Socratic hint error:", error);
    res.status(500).json({
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
    });
  }
});

// AI Question Tagging & Analysis
app.post("/api/ai/analyze-question", async (req, res) => {
  try {
    const { title, body } = req.body;
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
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || "Failed to analyze question",
      fallback: {
        subject: "Matematika",
        subTopic: "Aljabar & Kalkulus",
        difficulty: "Sedang",
        suggestedTags: ["Matematika", "HomeworkHelp", "StepByStep"],
        detectedFormulas: [],
        recommendedBounty: 25,
      },
    });
  }
});

// AI Solution Validation
app.post("/api/ai/verify-solution", async (req, res) => {
  try {
    const { question, solution } = req.body;
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
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || "Failed to verify solution",
      fallback: {
        isCorrect: true,
        clarityScore: 8,
        praise: "Clear sequential steps and neat presentation.",
        improvementTip: "Consider mentioning edge cases or units if applicable.",
        suggestedHonorBonus: 20,
      },
    });
  }
});

// Vite middleware for development & Static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TemanTugas server is running on http://localhost:${PORT}`);
  });
}

startServer();
