import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Globe } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function LoginPage() {
    const { login, loginStatus, identity } = useInternetIdentity();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        if (identity && !identity.getPrincipal().isAnonymous()) {
            navigate({ to: '/' });
        }
    }, [identity, navigate]);

    const handleLogin = async () => {
        try {
            await login();
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const isLoggingIn = loginStatus === 'logging-in';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
                        <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        {t('app.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('login.subtitle')}
                    </p>
                </div>

                <Card className="border-border/50 shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">{t('login.title')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('login.privacy')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                            className="w-full h-12 text-base"
                            size="lg"
                        >
                            {isLoggingIn ? t('login.connecting') : t('login.button')}
                        </Button>

                        <div className="pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Language
                                </label>
                                <Select value={language} onValueChange={(value) => setLanguage(value as 'pl' | 'en')}>
                                    <SelectTrigger className="w-32 border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pl">{t('language.polish')}</SelectItem>
                                        <SelectItem value="en">{t('language.english')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    © 2026. Built with love using{' '}
                    <a
                        href="https://caffeine.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        caffeine.ai
                    </a>
                </p>
            </div>
        </div>
    );
}
