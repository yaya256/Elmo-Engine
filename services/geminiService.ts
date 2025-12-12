import { GoogleGenAI, Type } from "@google/genai";
import { ProjectState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "Elmo Engine", an advanced, intelligent Game Engine Assistant.
Your goal is to help users build, debug, and refine HTML5 games using Canvas API, vanilla JavaScript, and CSS.

Role & Behavior:
- You act as a Senior Game Developer.
- You understand Game Loops, Entity Component Systems (simplified), Collision Detection, and Physics.
- When asked to modify code, analyze the *entire* context (HTML structure, CSS styling, JS logic).
- Make precise, robust changes. Avoid spaghetti code.
- If the user asks for a mechanic (e.g., "Add double jump"), implement it fully in the JS variables, update loop, input handling, etc.
- If the user reports a bug, analyze the code for logical errors (e.g., variable scope, race conditions).

Output:
- You must return JSON.
- 'explanation' should be concise but technical enough (e.g., "Added 'jumpCount' variable and modified 'keydown' listener.").
`;

export const modifyGameCode = async (
  currentCode: ProjectState,
  userPrompt: string
): Promise<{ newCode: ProjectState; explanation: string }> => {
  
  const prompt = `
  CURRENT PROJECT STATE:
  
  <!-- HTML -->
  ${currentCode.html}
  
  /* CSS */
  ${currentCode.css}
  
  // JS
  ${currentCode.js}
  
  USER REQUEST: "${userPrompt}"
  
  INSTRUCTIONS:
  1. Return the complete updated code strings for html, css, and js.
  2. Maintain existing functionality unless requested to change.
  3. Ensure the Game Loop logic remains intact.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            html: { type: Type.STRING, description: "The complete updated HTML code" },
            css: { type: Type.STRING, description: "The complete updated CSS code" },
            js: { type: Type.STRING, description: "The complete updated JavaScript code" },
            explanation: { type: Type.STRING, description: "A brief technical explanation of changes" }
          },
          required: ["html", "css", "js", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      newCode: {
        html: result.html || currentCode.html,
        css: result.css || currentCode.css,
        js: result.js || currentCode.js,
      },
      explanation: result.explanation || "Code updated successfully."
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process code modification request.");
  }
};