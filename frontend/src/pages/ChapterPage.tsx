import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ChapterList } from '../components/ChapterList';
import ChapterEditor from '../components/ChapterEditor';
import { EmptyState } from '../components/EmptyState';
import { useGetChapter } from '../hooks/useQueries';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useParams } from '@tanstack/react-router';

export function ChapterPage() {
    const { bookId, chapterId } = useParams({ from: '/book/$bookId/chapter/$chapterId' });
    const { data: chapter, isLoading } = useGetChapter(chapterId);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleChapterSelect = (id: string) => {
        navigate({ to: '/book/$bookId/chapter/$chapterId', params: { bookId, chapterId: id } });
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <ChapterList
                    bookId={bookId}
                    selectedChapterId={chapterId}
                    onSelectChapter={handleChapterSelect}
                />
                <main className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-muted-foreground">{t('general.loading')}</div>
                        </div>
                    ) : chapter ? (
                        <ChapterEditor chapterId={chapterId} bookId={bookId} />
                    ) : (
                        <EmptyState message={t('editor.notFound')} />
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}
