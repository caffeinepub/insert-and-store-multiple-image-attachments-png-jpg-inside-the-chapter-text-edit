import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ChapterList } from '../components/ChapterList';
import { EmptyState } from '../components/EmptyState';
import { useGetBook, useGetChaptersForBook } from '../hooks/useQueries';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useParams } from '@tanstack/react-router';
import { BookOpen } from 'lucide-react';

export function BookPage() {
    const { bookId } = useParams({ from: '/book/$bookId' });
    const { data: book, isLoading: isLoadingBook } = useGetBook(bookId);
    const { data: chapters, isLoading: isLoadingChapters } = useGetChaptersForBook(bookId);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleChapterSelect = (chapterId: string) => {
        navigate({ to: '/book/$bookId/chapter/$chapterId', params: { bookId, chapterId } });
    };

    const isLoading = isLoadingBook || isLoadingChapters;

    return (
        <div className="flex h-screen flex-col bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <ChapterList
                    bookId={bookId}
                    selectedChapterId={undefined}
                    onSelectChapter={handleChapterSelect}
                />
                <main className="flex-1 overflow-hidden flex items-center justify-center">
                    {isLoading ? (
                        <div className="text-center">
                            <div className="text-muted-foreground">{t('general.loading')}</div>
                        </div>
                    ) : book ? (
                        <div className="text-center space-y-6 p-8 max-w-2xl">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-8 shadow-feminine">
                                    <BookOpen className="h-16 w-16 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    {book.title}
                                </h1>
                                {book.description && (
                                    <p className="text-lg text-muted-foreground">
                                        {book.description}
                                    </p>
                                )}
                            </div>
                            <div className="pt-4">
                                <p className="text-sm text-muted-foreground">
                                    {t('book.chaptersCount', { count: String(chapters?.length || 0) })}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <EmptyState message={t('books.notFound')} />
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}
