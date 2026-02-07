import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Sparkles, Languages } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function LoginPage() {
    const { login, isLoggingIn, isLoginSuccess, identity, isInitializing } = useInternetIdentity();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    // Redirect if already authenticated (seamless flow)
    useEffect(() => {
        if (!isInitializing && identity) {
            navigate({ to: '/' });
        }
    }, [identity, isInitializing, navigate]);

    // Redirect after successful login
    useEffect(() => {
        if (isLoginSuccess && identity) {
            navigate({ to: '/' });
        }
    }, [isLoginSuccess, identity, navigate]);

    // Show loading state while checking authentication
    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">{t('loading')}</p>
                </div>
            </div>
        );
    }

    // Don't render login form if already authenticated (prevents flash)
    if (identity) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/5">
            {/* Language Selector in Top Right */}
            <div className="absolute top-6 right-6">
                <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'pl')}>
                    <SelectTrigger className="w-[140px] h-9 border-primary/20 hover:border-primary/40 transition-colors bg-card/80 backdrop-blur-sm">
                        <Languages className="mr-2 h-4 w-4 text-primary" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">{t('language.english')}</SelectItem>
                        <SelectItem value="pl">{t('language.polish')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-primary/20 shadow-feminine-lg bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-feminine">
                                <BookOpen className="h-8 w-8 text-primary-foreground" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    {t('app.title')}
                                </CardTitle>
                                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            </div>
                            <CardDescription className="text-base">
                                {t('login.subtitle')}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <p className="text-center text-sm text-muted-foreground">
                                {t('login.description')}
                            </p>
                            <Button
                                onClick={login}
                                disabled={isLoggingIn}
                                className="w-full h-12 text-base shadow-feminine hover:shadow-feminine-lg transition-all"
                                size="lg"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        {t('login.connecting')}
                                    </>
                                ) : (
                                    t('login.button')
                                )}
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <p className="text-xs text-center text-muted-foreground">
                                {t('login.privacy')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-muted-foreground">
                <p>
                    © 2025. {t('footer.builtWith')}{' '}
                    <span className="text-primary">❤</span>{' '}
                    {t('footer.using')}{' '}
                    <a
                        href="https://caffeine.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition-colors underline"
                    >
                        caffeine.ai
                    </a>
                </p>
            </footer>
        </div>
    );
}
