import { Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="border-t border-border bg-card px-6 py-2.5">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <span>© 2025. {t('footer.builtWith')}</span>
                <Heart className="h-3 w-3 fill-primary/60 text-primary/60" />
                <span>{t('footer.using')}</span>
                <a
                    href="https://caffeine.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-accent transition-colors"
                >
                    caffeine.ai
                </a>
            </div>
        </footer>
    );
}
