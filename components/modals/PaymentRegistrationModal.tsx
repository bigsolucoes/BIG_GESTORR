import React from 'react';
import Modal from '../Modal';
import PaymentRegistrationForm from '../forms/PaymentRegistrationForm';
import { Job } from '../../types';

interface PaymentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onSuccess: () => void;
}

const PaymentRegistrationModal: React.FC<PaymentRegistrationModalProps> = ({ isOpen, onClose, job, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Pagamento: ${job.name}`}
      size="lg"
    >
      <PaymentRegistrationForm jobToPay={job} onSuccess={onSuccess} />
    </Modal>
  );
};

export default PaymentRegistrationModal;