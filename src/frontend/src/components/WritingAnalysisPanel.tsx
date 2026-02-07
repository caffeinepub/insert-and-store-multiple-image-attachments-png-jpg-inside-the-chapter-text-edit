import { Lightbulb, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '../contexts/LanguageContext';

interface WritingAnalysisPanelProps {
    analysisResult: string | null;
    isAnalyzing: boolean;
    onClose: () => void;
}

interface AnalysisSection {
    type: 'suggestion' | 'issue' | 'strength';
    title: string;
    content: string;
}

export function WritingAnalysisPanel({ analysisResult, isAnalyzing, onClose }: WritingAnalysisPanelProps) {
    const { t } = useLanguage();

    const parseAnalysis = (result: string): AnalysisSection[] => {
        if (!result || result.trim() === '') {
            return [];
        }

        try {
            const parsed = JSON.parse(result);
            
            if (Array.isArray(parsed)) {
                return parsed.map(item => {
                    if (typeof item === 'string') {
                        return { type: 'suggestion', title: 'Sugestia', content: item };
                    }
                    return {
                        type: item.type || 'suggestion',
                        title: item.title || 'Analiza',
                        content: item.content || item.text || String(item),
                    };
                }).filter(item => item.content && item.content.trim().length > 0);
            }
            
            if (typeof parsed === 'object' && parsed !== null) {
                const sections: AnalysisSection[] = [];
                
                if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                    parsed.suggestions.forEach((s: any) => {
                        const content = typeof s === 'string' ? s : s.content || s.text || String(s);
                        if (content && content.trim()) {
                            sections.push({ type: 'suggestion', title: 'Sugestia', content });
                        }
                    });
                }
                
                if (parsed.issues && Array.isArray(parsed.issues)) {
                    parsed.issues.forEach((i: any) => {
                        const content = typeof i === 'string' ? i : i.content || i.text || String(i);
                        if (content && content.trim()) {
                            sections.push({ type: 'issue', title: 'Problem', content });
                        }
                    });
                }
                
                if (parsed.strengths && Array.isArray(parsed.strengths)) {
                    parsed.strengths.forEach((s: any) => {
                        const content = typeof s === 'string' ? s : s.content || s.text || String(s);
                        if (content && content.trim()) {
                            sections.push({ type: 'strength', title: 'Mocna strona', content });
                        }
                    });
                }
                
                if (sections.length === 0 && Object.keys(parsed).length > 0) {
                    Object.entries(parsed).forEach(([key, value]) => {
                        if (value && typeof value === 'string' && value.trim()) {
                            sections.push({
                                type: 'suggestion',
                                title: key.charAt(0).toUpperCase() + key.slice(1),
                                content: value,
                            });
                        }
                    });
                }
                
                return sections;
            }
        } catch (e) {
            console.log('JSON parsing failed, trying text parsing:', e);
        }

        const lines = result.split('\n').filter(line => line.trim());
        const sections: AnalysisSection[] = [];
        
        let currentType: 'suggestion' | 'issue' | 'strength' = 'suggestion';
        let currentTitle = 'Analiza';
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.toLowerCase().includes('sugestia') || 
                trimmedLine.toLowerCase().includes('sugestie')) {
                currentType = 'suggestion';
                currentTitle = 'Sugestia';
                return;
            }
            if (trimmedLine.toLowerCase().includes('problem') || 
                trimmedLine.toLowerCase().includes('błąd') ||
                trimmedLine.toLowerCase().includes('błędy')) {
                currentType = 'issue';
                currentTitle = 'Problem';
                return;
            }
            if (trimmedLine.toLowerCase().includes('mocna strona') || 
                trimmedLine.toLowerCase().includes('mocne strony') ||
                trimmedLine.toLowerCase().includes('zaleta')) {
                currentType = 'strength';
                currentTitle = 'Mocna strona';
                return;
            }
            
            if (trimmedLine.length < 3) {
                return;
            }
            
            sections.push({
                type: currentType,
                title: currentTitle,
                content: trimmedLine.replace(/^[-•*]\s*/, ''),
            });
        });
        
        return sections;
    };

    const sections = analysisResult ? parseAnalysis(analysisResult) : [];

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'issue':
                return 'destructive';
            case 'strength':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const getBadgeLabel = (type: string) => {
        switch (type) {
            case 'suggestion':
                return t('analysis.suggestion');
            case 'issue':
                return t('analysis.issue');
            case 'strength':
                return t('analysis.strength');
            default:
                return 'Analiza';
        }
    };

    return (
        <div className="w-80 border-l border-border bg-card flex flex-col">
            <div className="border-b border-border px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{t('analysis.title')}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 hover:bg-muted">
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {isAnalyzing && (
                        <Alert className="border-border">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <AlertDescription className="text-sm">
                                {t('analysis.analyzing')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isAnalyzing && !analysisResult && (
                        <Alert className="border-border">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-sm">
                                {t('analysis.clickToAnalyze')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isAnalyzing && analysisResult && sections.length === 0 && (
                        <Alert variant="destructive" className="border-destructive/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                {t('analysis.noFeedback')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isAnalyzing && sections.map((section, index) => (
                        <Card key={index} className="border-border">
                            <CardHeader className="pb-2 px-3 pt-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-medium">
                                        {section.title}
                                    </CardTitle>
                                    <Badge variant={getBadgeVariant(section.type)} className="text-xs">
                                        {getBadgeLabel(section.type)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <CardDescription className="text-xs leading-relaxed">
                                    {section.content}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
