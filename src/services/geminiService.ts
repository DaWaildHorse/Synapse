// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';

// Asegúrate de tener VITE_GEMINI_API_KEY en tu archivo .env
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

export const analyzeInformation = async (urlOrText: string) => {
  const prompt = `Actúa como un experto analista de datos, investigador y especialista en fact-checking.
  Analiza minuciosamente el siguiente contenido o enlace: "${urlOrText}"

  TU TAREA ES CRÍTICA: Debes identificar la afirmación o tema principal (claim). Luego, basándote en tu conocimiento global, DEBES buscar e identificar fuentes reales (medios de comunicación, estudios científicos, organizaciones, posturas políticas, etc.) que SOSTENGAN la información, y fuentes reales que la CONTRADIGAN o presenten una perspectiva opuesta.

  Debes responder ESTRICTAMENTE con un objeto JSON válido que siga exactamente esta estructura:
  {
    "graph": {
      "nodes": [
        { "id": "snake_case_id", "label": "Nombre corto de la fuente o tema", "type": "claim" | "source" | "entity", "confidence": 0.0 a 1.0 (solo para claims) }
      ],
      "links": [
        { "source": "node_id_origen", "target": "node_id_destino", "type": "MAKES" | "SUPPORTS" | "CONTRADICTS" | "MENTIONS" }
      ]
    },
    "analysis": {
      "summary": "Resumen general y objetivo de 2 a 3 oraciones.",
      "details": "Explicación profunda del contexto (3 a 5 oraciones). Asegúrate de mencionar brevemente por qué hay fuentes a favor y en contra.",
      "keyFacts": ["Hecho clave 1", "Hecho clave 2", "Hecho clave 3"],
      "relatedTopics": ["Tema 1", "Tema 2", "Tema 3"]
    },
    "metrics": {
      "veracity": número entero del 0 al 100 evaluando la veracidad general,
      "agree": número entero del 0 al 100 de consenso a favor,
      "disagree": número entero del 0 al 100 de consenso en contra,
      "neutral": número entero del 0 al 100 de posturas neutrales
    }
  }
  
  REGLAS ESTRICTAS:
  1. GRAFO CON CONTRASTE: Debes incluir al menos un nodo "source" que apoye el claim principal (link "SUPPORTS") y al menos un nodo "source" que lo contradiga (link "CONTRADICTS").
  2. MÚLTIPLES NODOS: Extrae al menos 7 nodos en total para que el grafo interactivo sea rico en contexto.
  3. MÉTRICAS EXACTAS: La suma de 'agree', 'disagree' y 'neutral' debe dar exactamente 100.`;

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