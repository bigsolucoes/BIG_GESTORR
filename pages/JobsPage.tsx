import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, JobStatus, Client } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { 
    KANBAN_COLUMNS, PlusCircleIcon, BriefcaseIcon, 
    ListBulletIcon, CurrencyDollarIcon, TableCellsIcon,
    ArchiveIcon, TrashIcon, CheckSquareIcon
} from '../constants';
import Modal from '../components/Modal';
import JobForm from './forms/JobForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import JobListTableView from '../components/JobListTableView';
import PaymentRegistrationModal from '../components/modals/PaymentRegistrationModal';
import JobDetailsPanel from '../components/JobDetailsPanel'; 
import TrashModal from '../components/modals/TrashModal'; 
import { useNavigate } from 'react-router-dom';


const JobCard: React.FC<{ 
  job: Job; 
  client?: Client; 
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, jobId: string) => void;
  isDraggable: boolean;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ job, client, onClick, onDragStart, isDraggable, onArchive, onDelete }) => {
  const { settings } = useAppData();
  const today = new Date();
  today.setHours(0,0,0,0);
  const deadlineDate = new Date(job.deadline);
  deadlineDate.setHours(0,0,0,0);

  const isOverdue = deadlineDate < today && job.status !== JobStatus.PAID && job.status !== JobStatus.FINALIZED;
  const { totalPaid, isFullyPaid } = getJobPaymentSummary(job);
  const paymentProgress = job.value > 0 ? (totalPaid / job.value) * 100 : (isFullyPaid ? 100 : 0);

  const completedTasks = job.tasks?.filter(t => t.isCompleted).length || 0;
  const totalTasks = job.tasks?.length || 0;

  return (
    <div 
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStart(e, job.id)}
      className={`mb-3 rounded-lg shadow-md bg-[#f9fcc5] hover:shadow-lg transition-all duration-200 
                  flex items-start gap-3 p-4
                  ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'opacity-80'}`}
    >
      {/* Left side action buttons */}
      <div className="flex space-x-1 pt-1">
        <button 
          onClick={onArchive} 
          className="p-1 text-slate-500 hover:text-green-500 hover:bg-green-100 rounded-full transition-colors"
          title="Arquivar Job"
        >
          <ArchiveIcon size={18} />
        </button>
        <button 
          onClick={onDelete} 
          className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
          title="Mover para Lixeira"
        >
          <TrashIcon size={18} />
        </button>
      </div>

      {/* Main card content */}
      <div className="flex-grow cursor-pointer" onClick={onClick}>
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-md text-text-primary mb-1 pr-2">{job.name}</h4>
            {isFullyPaid && (
              <span title="Este job foi totalmente pago.">
                <CurrencyDollarIcon className="text-green-500 w-5 h-5 flex-shrink-0" />
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mb-1">{client?.name || 'Cliente não encontrado'}</p>
          <p className="text-xs text-text-secondary mb-2">Valor: {formatCurrency(job.value, settings.privacyModeEnabled)}</p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className={`text-xs px-2 py-0.5 inline-block rounded-full ${
              isOverdue ? 'bg-red-100 text-red-700' : `bg-[#f0f3b4] text-yellow-900`
            }`}>
              Prazo: {formatDate(job.deadline)} {isOverdue && '(Atrasado)'}
            </div>
            {totalTasks > 0 && (
              <div className="flex items-center text-xs text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full" title={`${completedTasks} de ${totalTasks} tarefas concluídas`}>
                <CheckSquareIcon size={12} className="mr-1" />
                <span>{completedTasks}/{totalTasks}</span>
              </div>
            )}
          </div>
          
          {job.value > 0 && !isFullyPaid && (
            <div className="mt-2" title={`Pago: ${formatCurrency(totalPaid, settings.privacyModeEnabled)} de ${formatCurrency(job.value, settings.privacyModeEnabled)}`}>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${paymentProgress}%` }}></div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ 
  title: string; 
  status: JobStatus;
  jobsInColumn: Job[]; 
  clients: Client[]; 
  onJobCardClick: (job: Job) => void; 
  onDragStart: (e: React.DragEvent<HTMLDivElement>, jobId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetStatus: JobStatus) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onArchiveJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
}> = ({ title, status, jobsInColumn, clients, onJobCardClick, onDragStart, onDrop, onDragOver, onArchiveJob, onDeleteJob }) => {
  
  const isPaidColumnTarget = status === JobStatus.PAID;

  return (
    <div 
      className={`bg-slate-100 p-4 rounded-lg w-80 flex-shrink-0 min-h-[calc(100vh-250px)] 
                  ${isPaidColumnTarget ? 'border-2 border-dashed border-green-500 bg-green-50' : ''}`} 
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <h3 className={`font-semibold text-lg text-text-primary mb-4 sticky top-0 py-2 z-10 
                      ${isPaidColumnTarget ? 'bg-green-50' : 'bg-slate-100'}`}>{title} ({jobsInColumn.length})</h3>
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-310px)] pr-1"> 
        {jobsInColumn.length > 0 ? jobsInColumn.map(job => (
          <JobCard 
            key={job.id} 
            job={job} 
            client={clients.find(c => c.id === job.clientId)} 
            onClick={() => onJobCardClick(job)}
            onDragStart={onDragStart}
            isDraggable={true}
            onArchive={(e) => { e.stopPropagation(); onArchiveJob(job); }}
            onDelete={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
          />
        )) : <p className="text-sm text-text-secondary text-center py-4">Nenhum job nesta etapa.</p>}
      </div>
    </div>
  );
};

type ViewMode = 'kanban' | 'list';

const JobsPage: React.FC = () => {
  const { jobs, clients, updateJob, deleteJob, settings, loading, jobForDetails, setJobForDetails } = useAppData();
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewMode>('kanban');
  
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [jobForPaymentModal, setJobForPaymentModal] = useState<Job | undefined>(undefined);

  const [selectedJobForPanel, setSelectedJobForPanel] = useState<Job | undefined>(undefined);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const navigate = useNavigate();

  // Effect to open details panel when requested from another page (e.g., Calendar)
  useEffect(() => {
    if (jobForDetails) {
      const jobToView = jobs.find(j => j.id === jobForDetails.id);
      if (jobToView) {
        setSelectedJobForPanel(jobToView);
        setIsDetailsPanelOpen(true);
      }
      // Clear the global state to prevent re-opening
      setJobForDetails(null);
    }
  }, [jobForDetails, setJobForDetails, jobs]);


  const activeJobs = useMemo(() => {
    return jobs.filter(job => !job.isDeleted && job.status !== JobStatus.PAID);
  }, [jobs]);

  const handleAddJob = () => {
    setEditingJob(undefined);
    setFormModalOpen(true);
  };
  
  const handleArchiveClick = useCallback((job: Job) => {
    if (window.confirm(`Tem certeza que deseja arquivar o job "${job.name}"? O status será alterado para 'Pago' e ele será movido para o Arquivo Morto.`)) {
      const { remaining, isFullyPaid } = getJobPaymentSummary(job);
      
      if (!isFullyPaid) {
        const confirmMessage = `Este job ainda tem um saldo devedor de ${formatCurrency(remaining, false)}. Deseja arquivá-lo mesmo assim?`;
        if (!window.confirm(confirmMessage)) {
          return; // User cancelled
        }
      }

      updateJob({ ...job, status: JobStatus.PAID });
      toast.success(`Job "${job.name}" arquivado com sucesso!`);
      
      // If the job was open in the details panel, close it
      if (selectedJobForPanel?.id === job.id) {
        setIsDetailsPanelOpen(false);
        setSelectedJobForPanel(undefined);
      }
    }
  }, [updateJob, selectedJobForPanel]);

  const handleDeleteClick = useCallback((jobId: string) => {
    if (window.confirm('Tem certeza que deseja mover este job para a lixeira?')) {
      deleteJob(jobId);
      toast.success('Job movido para a lixeira!');
      if (selectedJobForPanel?.id === jobId) {
          setIsDetailsPanelOpen(false);
          setSelectedJobForPanel(undefined);
      }
    }
  }, [deleteJob, selectedJobForPanel]);

  const handleEditJobFromPanel = (job: Job) => {
    setEditingJob(job);
    setIsDetailsPanelOpen(false); 
    setFormModalOpen(true); 
  };

  const handleDeleteJobFromPanel = (jobId: string) => {
    if (window.confirm('Tem certeza que deseja mover este job para a lixeira?')) {
      deleteJob(jobId); 
      toast.success('Job movido para a lixeira!');
      setIsDetailsPanelOpen(false);
    }
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setEditingJob(undefined);
    if(selectedJobForPanel){ 
        const updatedJob = jobs.find(j => j.id === selectedJobForPanel.id);
        if(updatedJob && !updatedJob.isDeleted){
            setSelectedJobForPanel(updatedJob);
            setIsDetailsPanelOpen(true);
        } else {
            setIsDetailsPanelOpen(false); 
        }
    }
  };
  
  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetStatus: JobStatus) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');
    const jobToMove = jobs.find(j => j.id === jobId);

    if (jobToMove && !jobToMove.isDeleted) {
      if (targetStatus === JobStatus.PAID) {
          handleArchiveClick(jobToMove);
      } else {
        if (jobToMove.status !== targetStatus) {
          const targetColumnName = KANBAN_COLUMNS.find(col => col.status === targetStatus)?.title || "Não Categorizado";
          updateJob({ ...jobToMove, status: targetStatus });
          toast.success(`Job "${jobToMove.name}" movido para ${targetColumnName}!`);
        }
      }
    }
  }, [jobs, updateJob, handleArchiveClick]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  }, []);

  const handlePaymentModalSuccess = () => {
    setPaymentModalOpen(false);
    if (jobForPaymentModal?.id === selectedJobForPanel?.id) {
        const updatedJob = jobs.find(j => j.id === jobForPaymentModal.id);
        if (updatedJob && updatedJob.status === JobStatus.PAID) {
             setIsDetailsPanelOpen(false); 
        } else if (updatedJob) {
            setSelectedJobForPanel(updatedJob);
        }
    }
    setJobForPaymentModal(undefined);
  };

  const handleJobCardClick = (job: Job) => {
    setSelectedJobForPanel(job);
    setIsDetailsPanelOpen(true);
  };
  
  const handleCloseDetailsPanel = useCallback(() => {
    setIsDetailsPanelOpen(false);
    setSelectedJobForPanel(undefined);
  }, []);

  // This effect ensures the panel shows fresh data, correcting the observation list bug.
  useEffect(() => {
    if (isDetailsPanelOpen && selectedJobForPanel) {
      const updatedJobInList = jobs.find(j => j.id === selectedJobForPanel.id);
      if (updatedJobInList) {
        if (JSON.stringify(selectedJobForPanel) !== JSON.stringify(updatedJobInList)) {
            setSelectedJobForPanel(updatedJobInList);
        }
      } else {
        handleCloseDetailsPanel();
      }
    }
  }, [jobs, selectedJobForPanel, isDetailsPanelOpen, handleCloseDetailsPanel]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-text-primary">Gerenciamento de Jobs</h1>
        <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 p-1 bg-slate-200 rounded-lg">
            <button
                onClick={() => setCurrentView('kanban')}
                title="Visualização Kanban"
                className={`p-2 rounded-md transition-colors filter hover:brightness-100 ${currentView === 'kanban' ? 'bg-accent text-white shadow-sm' : 'hover:bg-slate-300'}`}
            >
                <BriefcaseIcon size={20} />
            </button>
            <button
                onClick={() => setCurrentView('list')}
                title="Visualização Lista Geral"
                className={`p-2 rounded-md transition-colors filter hover:brightness-100 ${currentView === 'list' ? 'bg-accent text-white shadow-sm' : 'hover:bg-slate-300'}`}
            >
                <ListBulletIcon size={20} />
            </button>
            </div>
            <button
            onClick={handleAddJob}
            className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center"
            >
            <PlusCircleIcon size={20} /> <span className="ml-2">Adicionar Job</span>
            </button>
        </div>
      </div>

      {currentView === 'kanban' ? (
        <div className="flex-grow overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {KANBAN_COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                title={column.title}
                status={column.status}
                jobsInColumn={column.status === JobStatus.PAID ? [] : activeJobs.filter(job => job.status === column.status)}
                clients={clients}
                onJobCardClick={handleJobCardClick}
                onDragStart={onDragStart}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onArchiveJob={handleArchiveClick}
                onDeleteJob={handleDeleteClick}
              />
            ))}
          </div>
        </div>
      ) : (
        <JobListTableView 
            jobs={activeJobs} 
            clients={clients} 
            onEditJob={(job) => { 
                setEditingJob(job);
                setFormModalOpen(true);
            }}
            onDeleteJob={(jobId) => { 
                 if (window.confirm('Tem certeza que deseja mover este job para a lixeira?')) {
                    deleteJob(jobId);
                    toast.success('Job movido para a lixeira!');
                }
            }}
            privacyModeEnabled={settings.privacyModeEnabled || false}
        />
      )}

      {/* Modals and Panels */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={editingJob ? 'Editar Job' : 'Adicionar Novo Job'} size="lg">
        <JobForm onSuccess={handleFormSuccess} jobToEdit={editingJob} />
      </Modal>

      {jobForPaymentModal && (
        <PaymentRegistrationModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setJobForPaymentModal(undefined); 
          }}
          job={jobForPaymentModal}
          onSuccess={handlePaymentModalSuccess}
        />
      )}

      {selectedJobForPanel && (
        <JobDetailsPanel
            job={selectedJobForPanel}
            client={clients.find(c => c.id === selectedJobForPanel.clientId)}
            isOpen={isDetailsPanelOpen}
            onClose={handleCloseDetailsPanel}
            onEdit={handleEditJobFromPanel}
            onDelete={handleDeleteJobFromPanel} 
            onRegisterPayment={() => {
                setJobForPaymentModal(selectedJobForPanel);
                setIsDetailsPanelOpen(false); 
                setPaymentModalOpen(true);
            }}
            onOpenArchive={() => navigate('/archive')}
            onOpenTrash={() => setIsTrashModalOpen(true)}
        />
      )}
      
      <Modal isOpen={isTrashModalOpen} onClose={() => setIsTrashModalOpen(false)} title="Lixeira de Jobs" size="xl">
        <TrashModal onClose={() => setIsTrashModalOpen(false)} />
      </Modal>

    </div>
  );
};

export default JobsPage;