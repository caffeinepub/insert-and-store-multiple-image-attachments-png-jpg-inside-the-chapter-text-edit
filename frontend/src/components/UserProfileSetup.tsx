import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileSetupProps {
    open: boolean;
}

export function UserProfileSetup({ open }: UserProfileSetupProps) {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const saveProfile = useSaveCallerUserProfile();

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error(t('profile.nameRequired'));
            return;
        }

        try {
            await saveProfile.mutateAsync({ name: name.trim() });
            toast.success(t('profile.saved'));
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast.error(t('profile.saveFailed'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="border-border/50" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-feminine">
                            <UserCircle className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">{t('profile.setup')}</DialogTitle>
                    <DialogDescription className="text-center">
                        {t('profile.setupDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('profile.name')}</Label>
                        <Input
                            id="name"
                            placeholder={t('profile.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border-border"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saveProfile.isPending || !name.trim()}
                        className="w-full"
                    >
                        {saveProfile.isPending ? t('profile.saving') : t('profile.saveButton')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
