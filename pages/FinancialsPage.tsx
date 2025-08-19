


import React, { useState, useMemo, Fragment } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, FinancialJobStatus, JobStatus, Payment } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, CurrencyDollarIcon, ChevronDownIcon, ChevronUpIcon } from '../constants';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentRegistrationModal from '../components/modals/PaymentRegistrationModal'; 
import { formatCurrency, formatDate } from '../utils/formatters';

const getFinancialStatus = (job: Job, totalPaid: number, remaining: number): FinancialJobStatus => {
    if (job.status === JobStatus.PAID || (job.value > 0 && remaining <= 0)) {
        return FinancialJobStatus.PAID;
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(job.deadline); deadline.setHours(0, 0, 0, 0);

    if (remaining > 0 && deadline < today) {
        return FinancialJobStatus.OVERDUE;
    }

    // User's specific request for 40% during briefing is important
    if (job.status === JobStatus.BRIEFING && job.value > 0 && totalPaid < (job.value * 0.4)) {
        return FinancialJobStatus.PENDING_DEPOSIT;
    }

    // For all other cases with a remaining balance
    if (remaining > 0) {
        return totalPaid > 0 ? FinancialJobStatus.PARTIALLY_PAID : FinancialJobStatus.PENDING_DEPOSIT;
    }
    
    // Fallback for cases like 0-value jobs, etc.
    return FinancialJobStatus.PENDING_FULL_PAYMENT;
};

const FinancialsPage: React.FC = () => {
  const { jobs, clients, settings, loading } = useAppData(); 
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<Job | undefined>(undefined);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const financialRecords = useMemo(() => jobs
    .filter(job => !job.isDeleted)
    .map(job => {
      const client = clients.find(c => c.id === job.clientId);
      const { totalPaid, remaining, isFullyPaid } = getJobPaymentSummary(job);
      return {
        ...job,
        clientName: client?.name || 'Cliente Desconhecido',
        financialStatus: getFinancialStatus(job, totalPaid, remaining),
        totalPaid,
        remaining,
        isFullyPaid
      };
    })
    .sort((a,b) => {
        if (a.isFullyPaid && !b.isFullyPaid) return 1;
        if (!a.isFullyPaid && b.isFullyPaid) return -1;
        try {
            const dateA = new Date(a.deadline).getTime();
            const dateB = new Date(b.deadline).getTime();
            return dateB - dateA;
        } catch (e) { return 0; }
    }), [jobs, clients]);

  const handleOpenPaymentModal = (job: Job) => {
    setSelectedJobForPayment(job);
    setPaymentModalOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedJobForPayment(undefined);
  };

  const toggleRowExpansion = (jobId: string) => {
    setExpandedRowId(prevId => (prevId === jobId ? null : jobId));
  };

  const StatusBadge: React.FC<{ status: FinancialJobStatus }> = ({ status }) => {
    let bgColor, textColor, IconComponent, text;

    switch (status) {
      case FinancialJobStatus.PAID:
        bgColor = 'bg-green-100'; textColor = 'text-green-700'; IconComponent = CheckCircleIcon; text = 'Pago';
        break;
      case FinancialJobStatus.OVERDUE:
        bgColor = 'bg-red-100'; textColor = 'text-red-700'; IconComponent = ExclamationCircleIcon; text = 'Atrasado';
        break;
      case FinancialJobStatus.PARTIALLY_PAID:
        bgColor = 'bg-slate-100'; textColor = 'text-slate-700'; IconComponent = ClockIcon; text = 'Parcialmente Pago';
        break;
      case FinancialJobStatus.PENDING_DEPOSIT:
        bgColor = 'bg-yellow-100'; textColor = 'text-yellow-700'; IconComponent = ClockIcon; text = 'Aguardando Entrada';
        break;
      case FinancialJobStatus.PENDING_FULL_PAYMENT:
      default:
        bgColor = 'bg-orange-100'; textColor = 'text-orange-700'; IconComponent = ClockIcon; text = 'Aguardando Pagamento';
        break;
    }
    return (
      <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
        <IconComponent size={14} /> <span className="ml-1.5">{text}</span>
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Central Financeira</h1>
      
      <div className="bg-card-bg shadow-lg rounded-xl overflow-hidden border border-border-color">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
            <thead className="bg-slate-50">
                <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-8"></th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Job / Cliente</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Valor Total</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Valor Pago</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Restante</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody className="bg-card-bg divide-y divide-border-color">
                {financialRecords.length > 0 ? financialRecords.map((record) => (
                <Fragment key={record.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                            {record.payments.length > 0 && (
                                <button onClick={() => toggleRowExpansion(record.id)} className="p-1 rounded-full hover:bg-slate-200">
                                    {expandedRowId === record.id ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16}/>}
                                </button>
                            )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-text-primary">{record.name}</div>
                            <div className="text-xs text-text-secondary">{record.clientName}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary font-semibold">
                            {formatCurrency(record.value, settings.privacyModeEnabled)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                            {formatCurrency(record.totalPaid, settings.privacyModeEnabled)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                            {formatCurrency(record.remaining, settings.privacyModeEnabled)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <StatusBadge status={record.financialStatus} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {!record.isFullyPaid && (
                            <button
                            onClick={() => handleOpenPaymentModal(record)}
                            className="text-accent hover:brightness-90 font-semibold transition-all flex items-center p-1 rounded hover:bg-green-50"
                            title="Registrar Pagamento"
                            >
                            <CurrencyDollarIcon size={18} /> <span className="ml-1">Registrar</span>
                            </button>
                        )}
                        </td>
                    </tr>
                    {expandedRowId === record.id && (
                        <tr className="bg-slate-50">
                            <td colSpan={7} className="p-0">
                                <div className="p-4">
                                    <h4 className="font-semibold text-sm mb-2 text-text-primary">Registros de Pagamento: {record.name}</h4>
                                    <div className="border border-border-color rounded-lg overflow-hidden">
                                        <table className="min-w-full">
                                            <thead className="bg-slate-200">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Data</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Valor</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Método</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Observações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-card-bg divide-y divide-border-color">
                                                {record.payments.map(p => (
                                                <tr key={p.id}>
                                                    <td className="px-3 py-2 text-sm text-text-secondary">{formatDate(p.date, {dateStyle: 'short', timeStyle: 'short'})}</td>
                                                    <td className="px-3 py-2 text-sm text-text-primary">{formatCurrency(p.amount, settings.privacyModeEnabled)}</td>
                                                    <td className="px-3 py-2 text-sm text-text-secondary">{p.method || '---'}</td>
                                                    <td className="px-3 py-2 text-sm text-text-secondary">{p.notes || '---'}</td>
                                                </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </Fragment>
                )) : (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-text-secondary">
                    Nenhum registro financeiro para exibir.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
      {selectedJobForPayment && (
        <PaymentRegistrationModal
            isOpen={isPaymentModalOpen}
            onClose={() => { setPaymentModalOpen(false); setSelectedJobForPayment(undefined);}}
            job={selectedJobForPayment}
            onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default FinancialsPage;