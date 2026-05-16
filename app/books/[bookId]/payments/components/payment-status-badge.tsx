const configs = {
  pending:  { label: 'Chờ duyệt',  className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt',   className: 'bg-green-100 text-green-700'  },
  rejected: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700'      },
} as const;

export function PaymentStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const { label, className } = configs[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${className}`}>
      {label}
    </span>
  );
}
