import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function analyzeCrop(imageBase64: string, language: 'en' | 'hi' = 'en') {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = 
    language === 'hi' 
    ? "आप एक कृषि विशेषज्ञ हैं। इस फसल की तस्वीर का विश्लेषण करें और पहचानें कि यह कौन सी फसल है और क्या इसमें कोई बीमारी है। अपनी प्रतिक्रिया हिंदी में दें। संरचना: फसल का नाम, बीमारी का नाम (यदि कोई हो), उपचार के सुझाव।"
    : "You are an agricultural expert. Analyze this crop photo and identify the crop and any diseases present. Provide your response in a structured way: Crop Name, Disease Name (if any), and treatment suggestions.";

  const prompt = "Identify this crop and check for any diseases. Provide signs, causes, and organic/chemical remedies if applicable.";

  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return result.text;
  } catch (error) {
    console.error("Error analyzing crop image:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}
