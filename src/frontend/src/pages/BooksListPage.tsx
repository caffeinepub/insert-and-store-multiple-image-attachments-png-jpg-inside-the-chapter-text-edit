import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EmptyState } from '../components/EmptyState';
import { UserProfileSetup } from '../components/UserProfileSetup';
import { useGetAllBooks, useCreateBook, useUpdateBook, useDeleteBook, useGetCallerUserProfile } from '../hooks/useQueries';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { BookOpen, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function BooksListPage() {
    const { identity } = useInternetIdentity();
    const { actor, isFetching: actorFetching } = useActor();
    const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
    const { data: books, isLoading: booksLoading } = useGetAllBooks();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const createBook = useCreateBook();
    const updateBook = useUpdateBook();
    const deleteBook = useDeleteBook();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newBookTitle, setNewBookTitle] = useState('');
    const [newBookDescription, setNewBookDescription] = useState('');
    const [editingBook, setEditingBook] = useState<{ id: string; title: string; description: string } | null>(null);

    const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
    const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
    const isBackendReady = !!actor && !actorFetching && isAuthenticated;

    const handleCreateBook = async () => {
        if (!newBookTitle.trim()) {
            toast.error(t('books.titleRequired'));
            return;
        }

        if (!isBackendReady) {
            toast.error(t('books.backendNotReady'));
            return;
        }

        const id = `book-${Date.now()}`;
        try {
            await createBook.mutateAsync({
                id,
                title: newBookTitle,
                description: newBookDescription,
            });
            toast.success(t('books.created'));
            setNewBookTitle('');
            setNewBookDescription('');
            setIsCreateDialogOpen(false);
            navigate({ to: '/book/$bookId', params: { bookId: id } });
        } catch (error: any) {
            console.error('Failed to create book:', error);
            const errorMessage = error?.message || t('books.createFailed');
            if (errorMessage.includes('Unauthorized')) {
                toast.error(t('books.unauthorized'));
            } else {
                toast.error(t('books.createFailed'));
            }
        }
    };

    const handleUpdateBook = async () => {
        if (!editingBook || !editingBook.title.trim()) {
            toast.error(t('books.titleRequired'));
            return;
        }

        try {
            await updateBook.mutateAsync({
                id: editingBook.id,
                title: editingBook.title,
                description: editingBook.description,
            });
            toast.success(t('books.updated'));
            setEditingBook(null);
            setIsEditDialogOpen(false);
        } catch (error: any) {
            console.error('Failed to update book:', error);
            toast.error(t('books.updateFailed'));
        }
    };

    const handleDeleteBook = async (id: string, title: string) => {
        try {
            await deleteBook.mutateAsync(id);
            toast.success(`"${title}" ${t('books.deleted')}`);
        } catch (error: any) {
            console.error('Failed to delete book:', error);
            toast.error(t('books.deleteFailed'));
        }
    };

    const handleBookClick = (bookId: string) => {
        navigate({ to: '/book/$bookId', params: { bookId } });
    };

    const handleEditClick = (book: { id: string; title: string; description: string }) => {
        setEditingBook(book);
        setIsEditDialogOpen(true);
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-8 max-w-6xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-foreground">
                                {t('books.myBooks')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t('books.subtitle')}
                            </p>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!isBackendReady}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('books.new')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="border-border/50">
                                <DialogHeader>
                                    <DialogTitle>{t('books.create')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">{t('books.title')}</Label>
                                        <Input
                                            id="title"
                                            placeholder={t('books.titlePlaceholder')}
                                            value={newBookTitle}
                                            onChange={(e) => setNewBookTitle(e.target.value)}
                                            className="border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">{t('books.description')}</Label>
                                        <Textarea
                                            id="description"
                                            placeholder={t('books.descriptionPlaceholder')}
                                            value={newBookDescription}
                                            onChange={(e) => setNewBookDescription(e.target.value)}
                                            className="border-border min-h-[100px]"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleCreateBook}
                                        disabled={createBook.isPending || !isBackendReady}
                                        className="w-full"
                                    >
                                        {createBook.isPending ? t('books.creating') : t('books.createButton')}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {booksLoading || profileLoading ? (
                        <div className="text-center py-12">
                            <div className="text-muted-foreground">{t('general.loading')}</div>
                        </div>
                    ) : books && books.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {books.map((book) => (
                                <Card
                                    key={book.id}
                                    className="group cursor-pointer transition-all hover:shadow-md border-border hover:border-primary/30"
                                    onClick={() => handleBookClick(book.id)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="rounded-lg bg-primary/10 p-2.5">
                                                    <BookOpen className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg truncate">{book.title}</CardTitle>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-muted"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="border-border/50">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditClick(book);
                                                        }}
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        {t('books.edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteBook(book.id, book.title);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('books.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        {book.description && (
                                            <CardDescription className="line-clamp-3 mt-2 text-sm">
                                                {book.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message={t('books.empty')} />
                    )}
                </div>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="border-border/50">
                        <DialogHeader>
                            <DialogTitle>{t('books.editTitle')}</DialogTitle>
                        </DialogHeader>
                        {editingBook && (
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">{t('books.title')}</Label>
                                    <Input
                                        id="edit-title"
                                        placeholder={t('books.titlePlaceholder')}
                                        value={editingBook.title}
                                        onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                                        className="border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">{t('books.description')}</Label>
                                    <Textarea
                                        id="edit-description"
                                        placeholder={t('books.descriptionPlaceholder')}
                                        value={editingBook.description}
                                        onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                                        className="border-border min-h-[100px]"
                                    />
                                </div>
                                <Button
                                    onClick={handleUpdateBook}
                                    disabled={updateBook.isPending}
                                    className="w-full"
                                >
                                    {updateBook.isPending ? t('books.updating') : t('books.updateButton')}
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
            <Footer />
            {showProfileSetup && <UserProfileSetup open={true} />}
        </div>
    );
}
