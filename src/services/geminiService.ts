// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';

// Asegúrate de tener VITE_GEMINI_API_KEY en tu archivo .env
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

export const analyzeInformation = async (urlOrText: string) => {
  const prompt = `Actúa como un experto en discernimiento de información y análisis de datos.
  Analiza el siguiente contenido o enlace: "${urlOrText}"

  Debes responder ESTRICTAMENTE con un objeto JSON válido que siga exactamente esta estructura:
  {
    "graph": {
      "nodes": [
        { "id": "snake_case_id", "label": "Nombre corto", "type": "claim" | "source" | "entity", "confidence": 0.0 a 1.0 (solo para claims) }
      ],
      "links": [
        { "source": "node_id", "target": "node_id", "type": "MAKES" | "SUPPORTS" | "CONTRADICTS" | "MENTIONS" }
      ]
    },
    "analysis": {
      "summary": "Resumen general de 2 a 3 oraciones.",
      "details": "Explicación profunda, contexto o trasfondo (3 a 5 oraciones).",
      "keyFacts": ["Hecho clave 1", "Hecho clave 2", "Hecho clave 3"],
      "relatedTopics": ["Tema 1", "Tema 2", "Tema 3"]
    },
    "metrics": {
      "veracity": número entero del 0 al 100,
      "agree": número entero del 0 al 100,
      "disagree": número entero del 0 al 100,
      "neutral": número entero del 0 al 100
    }
  }
  
  Asegúrate de que la suma de agree, disagree y neutral sea 100. Extrae al menos 4 nodos para el grafo.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json", // ¡Esto fuerza el JSON!
      }
    });

    if (!response.text) throw new Error("Respuesta vacía de Gemini");
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analizando con Gemini:", error);
    throw error;
  }
};