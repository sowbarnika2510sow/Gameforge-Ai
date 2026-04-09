import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GameAsset {
  id: string;
  name: string;
  type: '2d' | '3d' | 'level' | 'character' | 'environment';
  description: string;
  proceduralData?: any;
  visualStyle: string;
  theme: string;
  imageUrl?: string;
}

export interface GenerationInput {
  gameType: string;
  artStyle: string;
  theme: string;
  platform: string;
  difficulty: string;
  customPrompt?: string;
}

export async function generateAssetImage(asset: GameAsset): Promise<string | undefined> {
  try {
    const prompt = `Generate a high-quality game asset image for: ${asset.name}. 
    Type: ${asset.type}. 
    Style: ${asset.visualStyle}. 
    Theme: ${asset.theme}. 
    Description: ${asset.description}.
    Ensure it looks like a professional game asset.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error) {
    console.error("Image generation failed for asset", asset.name, error);
  }
  return undefined;
}

export async function generateGameAssets(input: GenerationInput): Promise<GameAsset[]> {
  const prompt = `Generate a set of game assets for a ${input.gameType} game.
  Art Style: ${input.artStyle}
  Theme: ${input.theme}
  Platform: ${input.platform}
  Difficulty: ${input.difficulty}
  ${input.customPrompt ? `Specific Details: ${input.customPrompt}` : ''}
  
  Provide exactly 5 assets:
  1. A 2D sprite/texture description.
  2. A 3D model description (character or prop).
  3. A procedural level layout (JSON structure).
  4. A character design with animation notes.
  5. An environmental setting (lighting, weather).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['2d', '3d', 'level', 'character', 'environment'] },
            description: { type: Type.STRING },
            proceduralData: { type: Type.OBJECT, description: "JSON data for level or animation structure" },
            visualStyle: { type: Type.STRING },
            theme: { type: Type.STRING },
          },
          required: ['id', 'name', 'type', 'description', 'visualStyle', 'theme'],
        },
      },
    },
  });

  try {
    const text = response.text || "[]";
    const assets: GameAsset[] = JSON.parse(text);
    return assets;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw e;
  }
}
