
import { Job } from '../types';

interface JobPaymentSummary {
  totalPaid: number;
  remaining: number;
  isFullyPaid: boolean;
}

export const getJobPaymentSummary = (job: Job | undefined): JobPaymentSummary => {
  if (!job) {
    return { totalPaid: 0, remaining: 0, isFullyPaid: false };
  }

  const totalPaid = (job.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, job.value - totalPaid);
  const isFullyPaid = remaining <= 0 && job.value > 0;

  return { totalPaid, remaining, isFullyPaid };
};
