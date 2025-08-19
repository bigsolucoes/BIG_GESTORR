import React from 'react';
import { Job, Client, JobStatus } from '../types';
import { PencilIcon, TrashIcon } from '../constants';
import { formatCurrency, formatDate } from '../utils/formatters';

interface JobListTableViewProps {
  jobs: Job[];
  clients: Client[];
  onEditJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
  privacyModeEnabled: boolean;
}

const getStatusClass = (status: JobStatus) => {
  switch (status) {
    case JobStatus.PAID: return 'bg-green-100 text-green-700';
    case JobStatus.FINALIZED: return 'bg-blue-100 text-blue-700';
    case JobStatus.REVIEW: return 'bg-yellow-100 text-yellow-700';
    case JobStatus.PRODUCTION: return 'bg-indigo-100 text-indigo-700';
    case JobStatus.BRIEFING: return 'bg-slate-100 text-slate-700';
    case JobStatus.OTHER: return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const JobListTableView: React.FC<JobListTableViewProps> = ({ jobs, clients, onEditJob, onDeleteJob, privacyModeEnabled }) => {
  
  const sortedJobs = [...jobs].sort((a, b) => {
    try {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Most recent first
    } catch {
      return 0;
    }
  });
  
  return (
    <div className="bg-card-bg shadow-lg rounded-xl overflow-hidden border border-border-color">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nome do Job</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Prazo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-card-bg divide-y divide-border-color">
            {sortedJobs.length > 0 ? sortedJobs.map((job) => {
              const client = clients.find(c => c.id === job.clientId);
              const today = new Date(); today.setHours(0,0,0,0);
              let deadlineDate: Date | null = null;
              try {
                deadlineDate = new Date(job.deadline);
                deadlineDate.setHours(0,0,0,0);
              } catch {}
              const isOverdue = deadlineDate && deadlineDate < today && job.status !== JobStatus.PAID && job.status !== JobStatus.FINALIZED;

              return (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{job.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{client?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{job.serviceType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {formatCurrency(job.value, privacyModeEnabled)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-text-secondary'}`}>
                    {formatDate(job.deadline)} {isOverdue && '(Atrasado)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => onEditJob(job)} className="text-slate-500 hover:text-accent p-1" title="Editar Job"><PencilIcon /></button>
                    <button onClick={() => onDeleteJob(job.id)} className="text-slate-500 hover:text-red-500 p-1" title="Excluir Job"><TrashIcon /></button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-text-secondary">
                  Nenhum job para exibir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobListTableView;