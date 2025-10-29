import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Candidate, Company } from '../types';

export async function findCompanies(
  latitude: number,
  longitude: number,
  industry: string
): Promise<Company[]> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Find up to 10 of the most significant and well-established companies in the "${industry}" sector near this location. Prioritize corporate headquarters or major regional offices, and avoid listing smaller branches or local outlets. Please provide only the company names.`;

  try {
    // FIX: `toolConfig` must be a property of the `config` object.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude,
            },
          },
        },
      },
    });

    const candidates = response.candidates as Candidate[] | undefined;
    const groundingChunks = candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const companies: Company[] = groundingChunks
      .filter(chunk => chunk.maps?.uri && chunk.maps?.title)
      .map(chunk => ({
        title: chunk.maps!.title,
        uri: chunk.maps!.uri,
      }))
      .slice(0, 10); // Restrict to a maximum of 10 locations

    return companies;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch company data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching company data.");
  }
}