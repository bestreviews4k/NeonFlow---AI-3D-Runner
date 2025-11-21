import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LevelTheme, DEFAULT_THEME } from "../types";

const cleanEnvKey = (key: string | undefined) => {
    if (!key) return "";
    return key.replace(/^["']|["']$/g, ""); // Remove wrapping quotes if present
};

const apiKey = cleanEnvKey(process.env.API_KEY);

const ai = new GoogleGenAI({ apiKey });

export const generateLevelTheme = async (prompt: string): Promise<LevelTheme> => {
  if (!apiKey) {
    console.warn("No API Key found, returning default theme.");
    return DEFAULT_THEME;
  }

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "A creative name for the level theme" },
      description: { type: Type.STRING, description: "Short evocative description of the atmosphere" },
      colors: {
        type: Type.OBJECT,
        properties: {
          background: { type: Type.STRING, description: "Hex color for the sky/background" },
          ground: { type: Type.STRING, description: "Hex color for the floor grid/plane" },
          player: { type: Type.STRING, description: "Hex color for the player character" },
          obstacle: { type: Type.STRING, description: "Hex color for the obstacles" },
          fog: { type: Type.STRING, description: "Hex color for the distance fog (usually matches background)" },
          sun: { type: Type.STRING, description: "Hex color for the primary light source" },
        },
        required: ["background", "ground", "player", "obstacle", "fog", "sun"]
      },
      shapeType: { 
        type: Type.STRING, 
        enum: ["box", "sphere", "cylinder", "dodecahedron"],
        description: "The geometric shape of the obstacles"
      },
      fogDensity: { type: Type.NUMBER, description: "Density of fog (0.01 to 0.15)" },
      lightingIntensity: { type: Type.NUMBER, description: "Intensity of ambient light (0.5 to 3.0)" },
      speedModifier: { type: Type.NUMBER, description: "Game speed multiplier based on mood (0.8 to 1.5)" }
    },
    required: ["name", "description", "colors", "shapeType", "fogDensity", "lightingIntensity", "speedModifier"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a visual theme for a 3D endless runner game based on the concept: "${prompt}". 
      Make sure the colors have good contrast so the player is visible against the ground and obstacles.
      The 'fog' color should generally match the 'background' color to create a seamless horizon.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a creative art director for video games. You excel at creating cohesive color palettes and atmospheres."
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as LevelTheme;
  } catch (error) {
    console.error("Failed to generate theme:", error);
    return DEFAULT_THEME;
  }
};