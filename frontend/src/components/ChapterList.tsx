import { useState } from 'react';
import { Plus, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetChaptersForBook, useCreateChapter, useDeleteChapter } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useLanguage } from '../contexts/LanguageContext';

interface ChapterListProps {
    bookId: string;
    selectedChapterId?: string;
    onSelectChapter: (chapterId: string) => void;
}

export function ChapterList({ bookId, selectedChapterId, onSelectChapter }: ChapterListProps) {
    const { data: chapters, isLoading } = useGetChaptersForBook(bookId);
    const createChapter = useCreateChapter();
    const deleteChapter = useDeleteChapter();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateChapter = async () => {
        if (!newChapterTitle.trim()) {
            toast.error(t('book.chapterTitleRequired'));
            return;
        }

        const id = `chapter-${Date.now()}`;
        try {
            await createChapter.mutateAsync({
                id,
                bookId,
                title: newChapterTitle,
                content: '',
            });
            toast.success(t('book.chapterCreated'));
            setNewChapterTitle('');
            setIsCreating(false);
            onSelectChapter(id);
        } catch (error) {
            toast.error(t('book.chapterCreateFailed'));
        }
    };

    const handleDeleteChapter = async (id: string) => {
        if (!confirm(t('book.confirmDeleteChapter'))) {
            return;
        }

        try {
            await deleteChapter.mutateAsync({ id, bookId });
            toast.success(t('book.chapterDeleted'));
            
            if (selectedChapterId === id) {
                const remainingChapters = chapters?.filter(c => c.id !== id);
                if (remainingChapters && remainingChapters.length > 0) {
                    onSelectChapter(remainingChapters[0].id);
                } else {
                    navigate({ to: '/book/$bookId', params: { bookId } });
                }
            }
        } catch (error) {
            toast.error(t('book.chapterDeleteFailed'));
        }
    };

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/' })}
                    className="w-full justify-start mb-2"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('book.backToBooks')}
                </Button>
                <h2 className="text-lg font-semibold">{t('book.chapters')}</h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2">
                    {isLoading ? (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            {t('book.loadingChapters')}
                        </div>
                    ) : chapters && chapters.length > 0 ? (
                        <div className="space-y-1">
                            {chapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                        selectedChapterId === chapter.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted'
                                    }`}
                                    onClick={() => onSelectChapter(chapter.id)}
                                >
                                    <span className="flex-1 text-sm truncate">{chapter.title}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChapter(chapter.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            {t('book.noChapters')}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
                {isCreating ? (
                    <div className="space-y-2">
                        <Input
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            placeholder={t('book.chapterTitlePlaceholder')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateChapter();
                                } else if (e.key === 'Escape') {
                                    setIsCreating(false);
                                    setNewChapterTitle('');
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleCreateChapter}
                                disabled={createChapter.isPending}
                                className="flex-1"
                            >
                                {t('books.createButton')}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewChapterTitle('');
                                }}
                            >
                                {t('books.cancel')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="w-full"
                        size="sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('book.createChapter')}
                    </Button>
                )}
            </div>
        </aside>
    );
}
