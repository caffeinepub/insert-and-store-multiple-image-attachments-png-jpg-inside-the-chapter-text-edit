import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchWithVoiceInput } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface VoiceSearchFieldProps {
    chapterId: string;
    content: string;
    onSearchResult?: (correctForm: string, found: boolean) => void;
}

export function VoiceSearchField({ chapterId, content, onSearchResult }: VoiceSearchFieldProps) {
    const { t } = useLanguage();
    const [isListening, setIsListening] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [correctForm, setCorrectForm] = useState<string | null>(null);
    const [isFound, setIsFound] = useState<boolean | null>(null);
    const recognitionRef = useRef<any>(null);
    const searchMutation = useSearchWithVoiceInput();

    useEffect(() => {
        // Initialize speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'pl-PL'; // Polish language

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setSearchText(transcript);
                handleSearch(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                
                if (event.error === 'no-speech') {
                    toast.error(t('voiceSearch.noSpeech'));
                } else if (event.error === 'not-allowed') {
                    toast.error(t('voiceSearch.permissionDenied'));
                } else {
                    toast.error(t('voiceSearch.error'));
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleSearch = async (word: string) => {
        if (!word.trim()) {
            toast.error(t('voiceSearch.emptyWord'));
            return;
        }

        try {
            const result = await searchMutation.mutateAsync({
                chapterId,
                spokenWord: word.trim(),
            });

            if (result) {
                setCorrectForm(result);
                setIsFound(true);
                toast.success(t('voiceSearch.found', { word: result }));
                
                if (onSearchResult) {
                    onSearchResult(result, true);
                }
            } else {
                setCorrectForm(word);
                setIsFound(false);
                toast.info(t('voiceSearch.notFound', { word }));
                
                if (onSearchResult) {
                    onSearchResult(word, false);
                }
            }
        } catch (error) {
            console.error('Voice search error:', error);
            toast.error(t('voiceSearch.failed'));
            setCorrectForm(null);
            setIsFound(null);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error(t('voiceSearch.notSupported'));
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setSearchText('');
            setCorrectForm(null);
            setIsFound(null);
            recognitionRef.current.start();
            setIsListening(true);
            toast.info(t('voiceSearch.listening'));
        }
    };

    const handleManualSearch = () => {
        if (searchText.trim()) {
            handleSearch(searchText);
        }
    };

    return (
        <div className="flex items-center gap-1.5 p-1.5 border border-border/50 rounded bg-card/50">
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleManualSearch();
                        }
                    }}
                    placeholder={t('voiceSearch.placeholder')}
                    className="border-none shadow-none focus-visible:ring-0 px-0 bg-transparent text-xs h-6"
                    disabled={isListening}
                />
            </div>
            
            {correctForm && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted border border-border/50 flex-shrink-0">
                    {isFound ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                    ) : (
                        <AlertCircle className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="text-[10px] font-medium">
                        {correctForm}
                    </span>
                </div>
            )}

            <Button
                size="sm"
                variant={isListening ? "default" : "ghost"}
                onClick={toggleListening}
                disabled={searchMutation.isPending}
                className={`h-6 px-1.5 text-[10px] flex-shrink-0 ${
                    isListening 
                        ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                        : 'hover:bg-muted'
                }`}
            >
                {isListening ? (
                    <MicOff className="h-3 w-3" />
                ) : (
                    <Mic className="h-3 w-3" />
                )}
            </Button>

            <Button
                size="sm"
                variant="ghost"
                onClick={handleManualSearch}
                disabled={!searchText.trim() || searchMutation.isPending}
                className="h-6 px-1.5 text-[10px] flex-shrink-0 hover:bg-muted"
            >
                <Search className="h-3 w-3" />
            </Button>
        </div>
    );
}
