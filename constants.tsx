import React from 'react';
import { JobStatus, ServiceType } from './types';
import { 
  Home, Briefcase, Users, CreditCard, BarChartBig, MessageCircle, Link2, FolderArchive, 
  Sparkles, Cog, PlusCircle, X, Trash2, Edit3, CheckCircle, AlertCircle, Clock, 
  DollarSign, Eye, EyeOff, List, ArrowRight, Settings, CalendarDays, Archive as ArchiveIconLucide, FileText, Bot,
  Save, Check, ChevronLeft, ChevronRight, Wallet, ExternalLink, ImageUp, ImageOff, Plus, Minus, Table, ChevronDown, ChevronUp, Paperclip, Bell, RotateCw,
  Download, Upload, LogOut, Printer, CheckSquare
} from 'lucide-react';

export const APP_NAME = "BIG";
export const ACCENT_COLOR = "custom-brown"; // This will be dynamically overridden by settings

// Lucide Icons Exports (using original names where possible, or new descriptive names)
export const HomeIcon = Home;
export const BriefcaseIcon = Briefcase;
export const UsersIcon = Users;
export const CreditCardIcon = CreditCard;
export const ChartBarIcon = BarChartBig; // ChartBar is small, BarChartBig is more substantial
export const WhatsAppIcon = MessageCircle; // Using MessageCircle as a generic chat icon
export const LinkIcon = Link2;
export const FolderIcon = FolderArchive; // Using FolderArchive as it's more descriptive
export const SparklesIcon = Sparkles;
export const PlusCircleIcon = PlusCircle;
export const XIcon = X;
export const TrashIcon = Trash2; // Main trash icon
export const PencilIcon = Edit3; // Pencil is Edit3 in Lucide
export const CheckCircleIcon = CheckCircle;
export const ExclamationCircleIcon = AlertCircle; // ExclamationCircle is AlertCircle
export const ClockIcon = Clock;
export const CurrencyDollarIcon = DollarSign; // CurrencyDollar is DollarSign
export const EyeOpenIcon = Eye;
export const EyeClosedIcon = EyeOff;
export const ListBulletIcon = List;
export const ArrowRightIcon = ArrowRight;
export const SettingsIcon = Settings; // For header settings button
export const CalendarIcon = CalendarDays; // For Calendar Menu
export const ArchiveIcon = ArchiveIconLucide; // For Archive Menu & Button
export const DraftIcon = FileText; // For Drafts Menu
export const BotIcon = Bot; // For AI Assistant in Drafts
export const SaveIcon = Save; // Newly added
export const CheckIcon = Check; // Newly added
export const ChevronLeftIcon = ChevronLeft; // Newly added
export const ChevronRightIcon = ChevronRight; // Newly added
export const ChevronDownIcon = ChevronDown; // Newly added
export const ChevronUpIcon = ChevronUp; // Newly added
export const WalletIcon = Wallet; // Newly added for "A Receber"
export const ExternalLinkIcon = ExternalLink; // Added for Asaas link
export const ImageUpIcon = ImageUp; // For adding/uploading image
export const ImageOffIcon = ImageOff; // For removing image
export const PaperclipIcon = Paperclip; // For attachments
export const BellIcon = Bell; // For notifications/updates
export const SyncIcon = RotateCw; // Newly added for calendar sync
export const UploadIcon = Upload; // For import
export const DownloadIcon = Download; // For export
export const LogOutIcon = LogOut; // For logout button
export const PrinterIcon = Printer; // For printing
export const CheckSquareIcon = CheckSquare; // For task checklist


// Specific use case icons, might be same as above but named for clarity
export const PageTrashIcon = Trash2; // For the trash button on JobsPage
export const RemoveLinkIcon = Trash2; // For removing a link in JobForm
export const CloudLinkIcon = Link2; // For displaying cloud links in JobDetailsPanel
export const PlusIcon = Plus; // Changed from PlusCircle for more generic use
export const MinusIcon = Minus; // For script tool
export const TrashRestoreIcon = Trash2; // Using Trash2 with a different meaning in context
export const TableCellsIcon = Table; // Alias for Kanban view toggle

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Jobs', path: '/jobs', icon: BriefcaseIcon },
  { name: 'Clientes', path: '/clients', icon: UsersIcon },
  { name: 'Financeiro', path: '/financials', icon: CreditCardIcon },
  { name: 'Desempenho', path: '/performance', icon: ChartBarIcon },
  { name: 'Calendário', path: '/calendar', icon: CalendarIcon },
  { name: 'Rascunho', path: '/drafts', icon: DraftIcon },
  // { name: 'Arquivo Morto', path: '/archive', icon: ArchiveIcon }, // Removed from main menu
  { name: 'WhatsApp', path: '/communication', icon: WhatsAppIcon },
  // { name: 'Pagamentos (Asaas)', path: '/asaas', icon: LinkIcon }, // Removed Asaas Iframe link
  // { name: 'Drive', path: '/drive', icon: FolderIcon }, // Removed Drive from main navigation
  { name: 'Assistente AI', path: '/ai-assistant', icon: SparklesIcon },
  // { name: 'Configurações', path: '/settings', icon: SettingsIcon }, // Removed from sidebar
];

export const JOB_STATUS_OPTIONS = [
  { value: JobStatus.BRIEFING, label: 'Briefing' },
  { value: JobStatus.PRODUCTION, label: 'Produção' },
  { value: JobStatus.REVIEW, label: 'Revisão' },
  { value: JobStatus.OTHER, label: 'Outros' },
  { value: JobStatus.FINALIZED, label: 'Finalizado' },
  { value: JobStatus.PAID, label: 'Pago' },
];

export const SERVICE_TYPE_OPTIONS = [
  { value: ServiceType.VIDEO, label: 'Vídeo' },
  { value: ServiceType.PHOTO, label: 'Fotografia' },
  { value: ServiceType.DESIGN, label: 'Design' },
  { value: ServiceType.SITES, label: 'Sites' },
  { value: ServiceType.AUXILIAR_T, label: 'Auxiliar T.' },
  { value: ServiceType.FRELLA, label: 'Frella' },
  { value: ServiceType.PROGRAMACAO, label: 'Programação' },
  { value: ServiceType.REDACAO, label: 'Redação' },
  { value: ServiceType.OTHER, label: 'Outro' },
];

export const KANBAN_COLUMNS = [
  { id: 'BRIEFING', title: 'Briefing', status: JobStatus.BRIEFING },
  { id: 'PRODUCTION', title: 'Produção', status: JobStatus.PRODUCTION },
  { id: 'REVIEW', title: 'Revisão', status: JobStatus.REVIEW },
  { id: 'OTHER', title: 'Outros', status: JobStatus.OTHER },
  { id: 'FINALIZED', title: 'Finalizado', status: JobStatus.FINALIZED },
  { id: 'PAID', title: 'Pago / Registrar Pagamento', status: JobStatus.PAID }, // Title indicates action or final state
];