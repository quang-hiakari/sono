import { getBook } from '@/lib/queries/books';
import { DebtForm } from './debt-form';

interface Props { params: Promise<{ bookId: string }> }

export default async function NewDebtPage({ params }: Props) {
  const { bookId } = await params;
  const book = await getBook(bookId);
  if (!book) return null;

  return <DebtForm bookId={bookId} currency={book.currency} />;
}
