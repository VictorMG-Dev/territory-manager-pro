
import { GoogleGenAI } from "@google/genai";
import { Territory } from "../types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const askGemini = async (prompt: string, territories: Territory[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key do Gemini não configurada.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare context data for the model
  const territorySummary = territories.map(t => ({
    codigo: t.code,
    nome: t.name,
    status: t.status,
    atraso_dias: t.daysSinceWork,
    ultimo_trabalho: t.lastWorkedDate ? formatDistanceToNow(t.lastWorkedDate.toDate(), { locale: ptBR, addSuffix: true }) : 'Nunca trabalhado',
    quem_trabalhou: t.lastWorkedBy || 'Ninguém'
  }));

  const systemInstruction = `
    Você é um assistente especializado em gerenciamento de territórios de pregação.
    Você tem acesso aos dados atuais do sistema para ajudar o usuário.
    Responda sempre em português brasileiro de forma clara, educada e objetiva.
    
    Dados atuais dos territórios:
    ${JSON.stringify(territorySummary, null, 2)}
    
    Se o usuário pedir sugestões, priorize territórios com status 'red' (mais de 90 dias) e depois 'yellow' (31-90 dias).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação com a IA.";
  }
};
