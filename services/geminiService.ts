
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Job, Client, CalendarEvent } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getJobPaymentSummary } from '../utils/jobCalculations';

// Ensure NEXT_PUBLIC_API_KEY is set in your environment variables for client-side access.
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_KEY) {
  console.warn("NEXT_PUBLIC_API_KEY for Gemini is not set. AI Assistant will not work. Please set it in your environment variables.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL_NAME = 'gemini-2.5-flash';

interface AppContextData {
  jobs: Job[];
  clients: Client[];
  calendarEvents?: CalendarEvent[];
}

// AI should always see real values, regardless of UI privacy mode
const formatDataForPrompt = (data: AppContextData): string => {
  let contextString = "Dados do Sistema:\n";
  contextString += "--- Jobs ---\n";
  if (data.jobs.length > 0) {
    data.jobs.forEach(job => {
      const clientName = data.clients.find(c => c.id === job.clientId)?.name || 'Desconhecido';
      const { totalPaid, remaining } = getJobPaymentSummary(job);
      const jobValueFormatted = formatCurrency(job.value, false);
      const totalPaidFormatted = formatCurrency(totalPaid, false);
      const remainingFormatted = formatCurrency(remaining, false);

      contextString += `Nome: ${job.name}, Cliente: ${clientName}, Valor Total: ${jobValueFormatted}, Total Pago: ${totalPaidFormatted}, Saldo Restante: ${remainingFormatted}, Prazo: ${new Date(job.deadline).toLocaleDateString('pt-BR')}, Status: ${job.status}, Tipo: ${job.serviceType}\n`;
    });
  } else {
    contextString += "Nenhum job cadastrado.\n";
  }
  
  contextString += "\n--- Clientes ---\n";
  if (data.clients.length > 0) {
    data.clients.forEach(client => {
      const clientJobs = data.jobs.filter(j => j.clientId === client.id);
      const totalBilled = clientJobs.reduce((sum, j) => sum + getJobPaymentSummary(j).totalPaid, 0);
      const totalBilledFormatted = formatCurrency(totalBilled, false);
      contextString += `Nome: ${client.name}, Empresa: ${client.company || 'N/A'}, Email: ${client.email}, Total Faturado (pago): ${totalBilledFormatted}\n`;
    });
  } else {
    contextString += "Nenhum cliente cadastrado.\n";
  }

  if (data.calendarEvents && data.calendarEvents.length > 0) {
    contextString += "\n--- Próximos Eventos do Calendário ---\n";
    const upcomingEvents = data.calendarEvents
      .filter(event => new Date(event.start) >= new Date())
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10);
    
    if (upcomingEvents.length > 0) {
        upcomingEvents.forEach(event => {
            contextString += `Evento: ${event.title}, Data: ${new Date(event.start).toLocaleString('pt-BR')}, Origem: ${event.source}\n`;
        });
    } else {
        contextString += "Nenhum evento futuro no calendário.\n";
    }
  }

  contextString += "---\n";
  return contextString;
};

export const callGeminiApi = async (
  userQuery: string, 
  appContextData: AppContextData
): Promise<GenerateContentResponse> => {
  if (!ai) {
    const mockResponse: GenerateContentResponse = {
      text: "Desculpe, o assistente de IA não está configurado corretamente (API Key ausente).",
      candidates: [],
    } as unknown as GenerateContentResponse;
    return Promise.resolve(mockResponse); 
  }

  const dataContext = formatDataForPrompt(appContextData);

  const systemInstruction = `Você é um assistente de IA para o sistema BIG, uma plataforma de gestão para freelancers criativos. 
  Sua principal função é ajudar o usuário a analisar e obter informações sobre seus jobs, clientes, finanças e calendário, com base nos dados fornecidos. 
  Seja conciso, direto e amigável. Use o formato de moeda R$ (Reais Brasileiros) quando apropriado.
  Responda em Português do Brasil.
  Se a pergunta for sobre eventos atuais ou informações que não estão nos dados fornecidos, você pode usar o Google Search.
  Se usar o Google Search, cite as fontes.
  Não invente informações se não estiverem nos dados ou na busca.
  Hoje é ${new Date().toLocaleDateString('pt-BR')}.`;

  const prompt = `${dataContext}\nPergunta do Usuário: ${userQuery}`;
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        // tools: [{googleSearch: {}}], // Enable if needed
      }
    });
    
    return response;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    let errorMessage = "Ocorreu um erro ao contatar o assistente de IA.";
    if (error instanceof Error) {
        errorMessage += ` Detalhes: ${error.message}`;
    }
     const mockErrorResponse: GenerateContentResponse = {
        text: errorMessage,
        candidates: [],
      } as unknown as GenerateContentResponse;
     return Promise.resolve(mockErrorResponse);
  }
};