
import { GoogleGenAI } from "@google/genai";
import { MatchData } from "../types";

export const getCoachAnalysis = async (matchData: MatchData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const statsSummary = Object.entries(matchData).map(([skill, stats]) => {
    return `${skill}: Eficiência ${stats.efficiency.toFixed(1)}%, Acertos ${stats.successCount}, Erros ${stats.errorCount}`;
  }).join('\n');

  const prompt = `
    Como um técnico de vôlei profissional, analise as seguintes estatísticas de um jogador/equipe e forneça um relatório curto e motivacional:
    
    ${statsSummary}
    
    Identifique os pontos fortes, os pontos a melhorar e dê 3 dicas práticas baseadas nesses dados. 
    Responda em Português do Brasil com tom profissional e encorajador.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return "Erro ao conectar com a inteligência do treinador.";
  }
};
