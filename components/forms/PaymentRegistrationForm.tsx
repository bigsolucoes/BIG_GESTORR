
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Job, JobStatus, Payment } from '../../types';
import { getJobPaymentSummary } from '../../utils/jobCalculations';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';

interface PaymentRegistrationFormProps {
  jobToPay: Job;
  onSuccess: () => void;
}

const PaymentRegistrationForm: React.FC<PaymentRegistrationFormProps> = ({ jobToPay, onSuccess }) => {
  const { updateJob, settings } = useAppData();
  const { remaining } = getJobPaymentSummary(jobToPay);
  
  const [amount, setAmount] = useState<number>(remaining);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  
  useEffect(() => {
    setAmount(getJobPaymentSummary(jobToPay).remaining);
  }, [jobToPay]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('O valor do pagamento deve ser maior que zero.');
      return;
    }
    if (!paymentDate) {
      toast.error('A data do pagamento é obrigatória.');
      return;
    }

    const newPayment: Payment = {
        id: uuidv4(),
        amount: Number(amount),
        date: new Date(paymentDate + "T12:00:00.000Z").toISOString(), // Use midday to avoid timezone issues
        method: paymentMethod || undefined,
        notes: paymentNotes || undefined,
    };
    
    const updatedPayments = [...jobToPay.payments, newPayment];
    const newSummary = getJobPaymentSummary({ ...jobToPay, payments: updatedPayments });

    const updatedJob: Job = {
      ...jobToPay,
      payments: updatedPayments,
      status: newSummary.isFullyPaid ? JobStatus.PAID : jobToPay.status,
    };

    updateJob(updatedJob);
    
    if (newSummary.isFullyPaid) {
        toast.success('Pagamento final registrado! Job arquivado.');
    } else {
        toast.success(`Pagamento de ${formatCurrency(amount, false)} registrado!`);
    }

    onSuccess();
  };
  
  const commonInputClass = "w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary outline-none transition-shadow bg-card-bg";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
            <p className="text-sm text-text-secondary">Saldo Restante para {jobToPay.name}</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(remaining, settings.privacyModeEnabled)}</p>
       </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Valor a Registrar (R$) <span className="text-red-500">*</span></label>
        <input 
          type="number" 
          id="amount" 
          value={amount} 
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
          className={commonInputClass} 
          required 
          min="0.01"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="paymentDate" className="block text-sm font-medium text-text-secondary mb-1">Data do Pagamento <span className="text-red-500">*</span></label>
        <input 
          type="date" 
          id="paymentDate" 
          value={paymentDate} 
          onChange={(e) => setPaymentDate(e.target.value)} 
          className={commonInputClass} 
          required 
        />
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-text-secondary mb-1">Método de Pagamento</label>
        <input 
          type="text" 
          id="paymentMethod" 
          value={paymentMethod} 
          onChange={(e) => setPaymentMethod(e.target.value)} 
          className={commonInputClass}
          placeholder="Ex: PIX, Transferência Bancária"
        />
      </div>
      
      <div>
        <label htmlFor="paymentNotes" className="block text-sm font-medium text-text-secondary mb-1">Observações do Pagamento</label>
        <textarea 
          id="paymentNotes" 
          value={paymentNotes} 
          onChange={(e) => setPaymentNotes(e.target.value)} 
          rows={2} 
          className={commonInputClass} 
          placeholder="Detalhes adicionais sobre o pagamento..."
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:brightness-90 transition-all">
          Salvar Pagamento
        </button>
      </div>
    </form>
  );
};

export default PaymentRegistrationForm;
