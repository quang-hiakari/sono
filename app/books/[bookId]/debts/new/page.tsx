'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { DebtForm } from './debt-form';

export default function NewDebtPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const currency = useSearchParams().get('currency') || 'VND';
  return <DebtForm bookId={bookId} currency={currency} />;
}
