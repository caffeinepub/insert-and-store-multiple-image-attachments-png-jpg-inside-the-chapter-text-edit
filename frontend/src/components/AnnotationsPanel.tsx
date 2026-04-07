import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
    useGetAnnotationsForChapter,
    useAddAnnotation,
    useUpdateAnnotation,
    useDeleteAnnotation,
} from '../hooks/useQueries';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface AnnotationsPanelProps {
    chapterId: string;
}

export function AnnotationsPanel({ chapterId }: AnnotationsPanelProps) {
    const { data: annotations, isLoading } = useGetAnnotationsForChapter(chapterId);
    const addAnnotation = useAddAnnotation();
    const updateAnnotation = useUpdateAnnotation();
    const deleteAnnotation = useDeleteAnnotation();
    const { t } = useLanguage();

    const [newAnnotationContent, setNewAnnotationContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleAddAnnotation = async () => {
        if (!newAnnotationContent.trim()) {
            toast.error(t('annotations.contentRequired'));
            return;
        }

        const id = `annotation-${Date.now()}`;
        try {
            await addAnnotation.mutateAsync({
                id,
                chapterId,
                content: newAnnotationContent,
            });
            toast.success(t('annotations.added'));
            setNewAnnotationContent('');
        } catch (error) {
            toast.error(t('annotations.addFailed'));
        }
    };

    const handleUpdateAnnotation = async (id: string) => {
        if (!editContent.trim()) {
            toast.error(t('annotations.contentEmpty'));
            return;
        }

        try {
            await updateAnnotation.mutateAsync({
                id,
                content: editContent,
                chapterId,
            });
            toast.success(t('annotations.updated'));
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            toast.error(t('annotations.updateFailed'));
        }
    };

    const handleDeleteAnnotation = async (id: string) => {
        try {
            await deleteAnnotation.mutateAsync({ id, chapterId });
            toast.success(t('annotations.deleted'));
        } catch (error) {
            toast.error(t('annotations.deleteFailed'));
        }
    };

    const startEditing = (id: string, content: string) => {
        setEditingId(id);
        setEditContent(content);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
    };

    return (
        <aside className="w-80 bg-card border-l border-border">
            <div className="flex h-full flex-col">
                <div className="border-b border-border p-3">
                    <h2 className="text-sm font-semibold">{t('annotations.title')}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('annotations.subtitle')}</p>
                </div>

                <ScrollArea className="flex-1 p-3">
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="text-center text-sm text-muted-foreground">{t('annotations.loading')}</div>
                        ) : annotations && annotations.length > 0 ? (
                            annotations.map((annotation) => (
                                <Card key={annotation.id} className="border-border">
                                    <CardContent className="p-3">
                                        {editingId === annotation.id ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="min-h-[70px] text-sm border-border"
                                                />
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateAnnotation(annotation.id)}
                                                        disabled={updateAnnotation.isPending}
                                                        className="h-7 text-xs"
                                                    >
                                                        <Check className="mr-1 h-3 w-3" />
                                                        {t('annotations.save')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={cancelEditing}
                                                        className="h-7 text-xs border-border"
                                                    >
                                                        <X className="mr-1 h-3 w-3" />
                                                        {t('annotations.cancel')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm whitespace-pre-wrap">{annotation.content}</p>
                                                <div className="mt-2 flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            startEditing(annotation.id, annotation.content)
                                                        }
                                                        className="h-7 px-2 hover:bg-muted"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteAnnotation(annotation.id)}
                                                        disabled={deleteAnnotation.isPending}
                                                        className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                {t('annotations.noAnnotations')}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="border-t border-border p-3 space-y-2">
                    <Textarea
                        value={newAnnotationContent}
                        onChange={(e) => setNewAnnotationContent(e.target.value)}
                        placeholder={t('annotations.placeholder')}
                        className="min-h-[70px] text-sm border-border"
                    />
                    <Button
                        onClick={handleAddAnnotation}
                        disabled={addAnnotation.isPending}
                        className="w-full text-xs"
                        size="sm"
                    >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        {addAnnotation.isPending ? t('annotations.adding') : t('annotations.add')}
                    </Button>
                </div>
            </div>
        </aside>
    );
}
