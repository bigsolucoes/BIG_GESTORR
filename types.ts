
export enum ServiceType {
  VIDEO = 'Vídeo',
  PHOTO = 'Fotografia',
  DESIGN = 'Design',
  SITES = 'Sites',
  AUXILIAR_T = 'Auxiliar T.',
  FRELLA = 'Frella',
  PROGRAMACAO = 'Programação',
  REDACAO = 'Redação',
  OTHER = 'Outro',
}

export enum JobStatus {
  BRIEFING = 'Briefing',
  PRODUCTION = 'Produção',
  REVIEW = 'Revisão',
  FINALIZED = 'Finalizado',
  PAID = 'Pago',
  OTHER = 'Outros',
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  cpf?: string;
  observations?: string;
  createdAt: string;
}

export interface JobObservation {
  id: string;
  text: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO String
  method?: string;
  notes?: string;
}

export interface Job {
  id: string;
  name: string;
  clientId: string;
  serviceType: ServiceType;
  value: number;
  cost?: number; // New for profitability tracking
  deadline: string; // ISO string date
  status: JobStatus;
  cloudLinks?: string[]; 
  createdAt: string;
  notes?: string; // General job notes
  isDeleted?: boolean;
  observationsLog?: JobObservation[];
  payments: Payment[]; // Replaces all old payment fields
  createCalendarEvent?: boolean; // For Google Calendar integration
  calendarEventId?: string; // ID of the event created in the calendar
  isRecurring?: boolean;
}

export enum FinancialJobStatus {
  PENDING_DEPOSIT = 'Aguardando Entrada',
  PARTIALLY_PAID = 'Parcialmente Pago',
  PENDING_FULL_PAYMENT = 'Aguardando Pagamento',
  PAID = 'Pago',
  OVERDUE = 'Atrasado',
}


export interface FinancialRecord extends Job {
  financialStatus: FinancialJobStatus;
  clientName?: string;
  totalPaid: number;
  remaining: number;
}

export interface AIChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  relatedData?: unknown;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export interface AppSettings {
  customLogo?: string; // base64 string
  asaasUrl?: string;
  userName?: string; // This is for display name in dashboard, not auth username
  primaryColor?: string;
  accentColor?: string;
  splashScreenBackgroundColor?: string;
  privacyModeEnabled?: boolean; 
  googleCalendarConnected?: boolean;
  googleCalendarLastSync?: string;
}

export interface User {
  id:string;
  username: string; 
}

export interface ScriptLine {
  id: string;
  scene: string;
  description: string;
  duration: number; // in seconds
}

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string; // base64
}

export interface DraftNote {
  id: string;
  title: string;
  type: 'TEXT' | 'SCRIPT';
  content: string; 
  scriptLines: ScriptLine[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  allDay: boolean;
  source: 'google' | 'big';
  jobId?: string;
}