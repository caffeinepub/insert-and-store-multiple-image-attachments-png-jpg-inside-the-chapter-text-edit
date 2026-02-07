import { BookOpen, Moon, Sun, Languages, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '../contexts/LanguageContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export function Header() {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { clear, identity } = useInternetIdentity();
    const navigate = useNavigate();

    const handleLogout = () => {
        clear();
        toast.success(t('login.loggedOut'));
        navigate({ to: '/login' });
    };

    return (
        <header className="border-b border-border bg-card">
            <div className="flex h-14 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            {t('app.title')}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'pl')}>
                        <SelectTrigger className="w-[130px] h-8 text-sm border-border hover:bg-muted transition-colors">
                            <Languages className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">{t('language.english')}</SelectItem>
                            <SelectItem value="pl">{t('language.polish')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-8 w-8 hover:bg-muted transition-colors"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
                        <span className="sr-only">{t('theme.toggle')}</span>
                    </Button>
                    {identity && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-8 w-8 hover:bg-destructive/10 transition-colors"
                            title={t('login.logout')}
                        >
                            <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            <span className="sr-only">{t('login.logout')}</span>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
