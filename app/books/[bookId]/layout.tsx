import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getBook } from '@/lib/queries/books';
import { BookShell } from './components/book-shell';

interface Props {
  children: React.ReactNode;
  params: Promise<{ bookId: string }>;
}

export default async function BookLayout({ children, params }: Props) {
  const { bookId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect('/login');

  const book = await getBook(bookId);
  if (!book) notFound();

  const isCreditor = book.creditor_id === me.id;
  const isDebtor = book.debtor_id === me.id;
  if (!isCreditor && !isDebtor) redirect('/books');

  return (
    <BookShell book={book} myId={me.id} isCreditor={isCreditor}>
      {children}
    </BookShell>
  );
}
