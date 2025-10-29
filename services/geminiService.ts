import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Candidate, Company } from '../types';

export async function findCompanies(
  latitude: number,
  longitude: number,
  industry: string,
  radiusInKm: number
): Promise<Company[]> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Find all significant and well-established companies in the "${industry}" sector within a ${radiusInKm} kilometer radius of this location. For each company, provide its full name and complete street address. Prioritize corporate headquarters or major regional offices, and avoid listing smaller branches or local outlets.`;

  try {
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
      .map(chunk => {
        const fullTitle = chunk.maps!.title;
        const parts = fullTitle.split(',');
        const title = parts[0].trim();
        const address = parts.slice(1).join(',').trim();
        return {
          title: title,
          address: address || 'Address not available',
          uri: chunk.maps!.uri,
        };
      });

    return companies;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch company data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching company data.");
  }
}