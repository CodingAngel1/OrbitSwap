import type { TransactionStatus } from '@/types';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

const statusConfig: Record<
  TransactionStatus,
  { label: string; className: string; dot: string }
> = {
  preparing: {
    label: 'Preparing',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    dot: 'bg-gray-400',
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400 animate-pulse',
  },
  signing: {
    label: 'Signing',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400 animate-pulse',
  },
  submitting: {
    label: 'Submitting',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400 animate-pulse',
  },
  pending: {
    label: 'Pending',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400 animate-pulse',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
  },
  timeout: {
    label: 'Timeout',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    dot: 'bg-gray-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={clsx('badge', config.className, className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
