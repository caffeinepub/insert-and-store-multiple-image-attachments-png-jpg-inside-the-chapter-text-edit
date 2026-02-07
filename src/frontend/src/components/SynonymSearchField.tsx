import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, BookOpen, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface SynonymSearchFieldProps {
    onSynonymSelect?: (synonym: string) => void;
}

export function SynonymSearchField({ onSynonymSelect }: SynonymSearchFieldProps) {
    const { t } = useLanguage();
    const [isListening, setIsListening] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [synonyms, setSynonyms] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [lastSearchedWord, setLastSearchedWord] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const recognitionRef = useRef<any>(null);

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
                    toast.error(t('synonymSearch.noSpeech'));
                    setError(t('synonymSearch.noSpeech'));
                } else if (event.error === 'not-allowed') {
                    toast.error(t('synonymSearch.permissionDenied'));
                    setError(t('synonymSearch.permissionDenied'));
                } else {
                    toast.error(t('synonymSearch.error'));
                    setError(t('synonymSearch.error'));
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
    }, [t]);

    const fetchSynonymsFromSynonimNet = async (word: string): Promise<string[]> => {
        try {
            // Normalize the word for URL
            const normalizedWord = word.trim().toLowerCase();
            const url = `https://synonim.net/synonim/${encodeURIComponent(normalizedWord)}`;
            
            // Fetch the page
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                },
                mode: 'cors',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return []; // No synonyms found
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            
            // Parse HTML to extract synonyms from synonim.net
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const extractedSynonyms: string[] = [];

            // Strategy 1: Look for synonym list containers
            // synonim.net typically uses specific structures for synonym lists
            const synonymContainers = doc.querySelectorAll(
                '.synonyms, .synonym-list, [class*="synonym"], .word-list, .results'
            );
            
            synonymContainers.forEach((container) => {
                // Extract text from links within containers
                const links = container.querySelectorAll('a');
                links.forEach((link) => {
                    const text = link.textContent?.trim();
                    const href = link.getAttribute('href');
                    
                    // Filter valid synonym links
                    if (text && 
                        text.length > 0 && 
                        text !== normalizedWord && 
                        href && 
                        (href.includes('/synonim/') || href.includes('synonym'))) {
                        extractedSynonyms.push(text);
                    }
                });

                // Also check for span or div elements that might contain synonyms
                const spans = container.querySelectorAll('span, div');
                spans.forEach((span) => {
                    const text = span.textContent?.trim();
                    if (text && 
                        text.length > 0 && 
                        text.length < 50 && // Reasonable word length
                        text !== normalizedWord &&
                        !text.includes(':') && // Avoid labels
                        !extractedSynonyms.includes(text)) {
                        // Check if it looks like a single word or short phrase
                        const wordCount = text.split(/\s+/).length;
                        if (wordCount <= 3) {
                            extractedSynonyms.push(text);
                        }
                    }
                });
            });

            // Strategy 2: Look for all links that point to synonym pages
            if (extractedSynonyms.length === 0) {
                const allLinks = doc.querySelectorAll('a[href*="/synonim/"]');
                allLinks.forEach((link) => {
                    const text = link.textContent?.trim();
                    if (text && 
                        text.length > 0 && 
                        text.length < 50 &&
                        text !== normalizedWord && 
                        !extractedSynonyms.includes(text)) {
                        extractedSynonyms.push(text);
                    }
                });
            }

            // Strategy 3: Look in main content area
            if (extractedSynonyms.length === 0) {
                const mainContent = doc.querySelector('main, .main, .content, #content, article');
                if (mainContent) {
                    const contentLinks = mainContent.querySelectorAll('a');
                    contentLinks.forEach((link) => {
                        const text = link.textContent?.trim();
                        const href = link.getAttribute('href');
                        if (text && 
                            text.length > 0 && 
                            text.length < 50 &&
                            text !== normalizedWord && 
                            href &&
                            href.includes('synonim') &&
                            !extractedSynonyms.includes(text)) {
                            extractedSynonyms.push(text);
                        }
                    });
                }
            }

            // Strategy 4: Look for list items that might contain synonyms
            if (extractedSynonyms.length === 0) {
                const listItems = doc.querySelectorAll('li, .item, [class*="word"]');
                listItems.forEach((item) => {
                    const text = item.textContent?.trim();
                    if (text && 
                        text.length > 0 && 
                        text.length < 50 &&
                        text !== normalizedWord &&
                        !text.includes(':') &&
                        !extractedSynonyms.includes(text)) {
                        const wordCount = text.split(/\s+/).length;
                        if (wordCount <= 3) {
                            extractedSynonyms.push(text);
                        }
                    }
                });
            }

            // Clean up and deduplicate
            const cleanedSynonyms = extractedSynonyms
                .map(s => s.trim())
                .filter(s => {
                    // Remove empty, too long, or invalid entries
                    return s.length > 0 && 
                           s.length < 50 && 
                           s !== normalizedWord &&
                           !s.toLowerCase().includes('synonim') &&
                           !s.toLowerCase().includes('zobacz') &&
                           !s.toLowerCase().includes('więcej') &&
                           !/^\d+$/.test(s); // Not just numbers
                });

            // Remove duplicates and limit to reasonable number
            const uniqueSynonyms = Array.from(new Set(cleanedSynonyms)).slice(0, 20);
            
            return uniqueSynonyms;
        } catch (error) {
            console.error('Error fetching synonyms from synonim.net:', error);
            throw error;
        }
    };

    const handleSearch = async (word: string) => {
        if (!word.trim()) {
            toast.error(t('synonymSearch.emptyWord'));
            setError(t('synonymSearch.emptyWord'));
            return;
        }

        setError(null);
        setIsSearching(true);
        setLastSearchedWord(word.trim());

        try {
            const result = await fetchSynonymsFromSynonimNet(word.trim());

            if (result && result.length > 0) {
                setSynonyms(result);
                toast.success(t('synonymSearch.found', { count: String(result.length) }));
            } else {
                setSynonyms([]);
                const noResultsMsg = t('synonymSearch.notFound', { word: word.trim() });
                toast.info(noResultsMsg);
                setError(noResultsMsg);
            }
        } catch (error) {
            console.error('Synonym search error:', error);
            const errorMsg = t('synonymSearch.failed');
            toast.error(errorMsg);
            setError(errorMsg);
            setSynonyms([]);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            const notSupportedMsg = t('synonymSearch.notSupported');
            toast.error(notSupportedMsg);
            setError(notSupportedMsg);
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setSearchText('');
            setSynonyms([]);
            setError(null);
            recognitionRef.current.start();
            setIsListening(true);
            toast.info(t('synonymSearch.listening'));
        }
    };

    const handleManualSearch = () => {
        if (searchText.trim()) {
            handleSearch(searchText);
        } else {
            const emptyMsg = t('synonymSearch.emptyWord');
            toast.error(emptyMsg);
            setError(emptyMsg);
        }
    };

    const handleRetry = () => {
        if (lastSearchedWord) {
            setSearchText(lastSearchedWord);
            handleSearch(lastSearchedWord);
        }
    };

    const handleSynonymClick = (synonym: string) => {
        if (onSynonymSelect) {
            onSynonymSelect(synonym);
        }
        toast.success(t('synonymSearch.selected', { word: synonym }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isListening) {
            handleManualSearch();
        }
    };

    return (
        <div className="flex flex-col gap-1.5 p-1.5 border border-border/50 rounded bg-card/50">
            <div className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('synonymSearch.placeholder')}
                        className="border-none shadow-none focus-visible:ring-0 px-0 bg-transparent text-xs h-6"
                        disabled={isListening || isSearching}
                    />
                </div>

                <Button
                    size="sm"
                    variant={isListening ? "default" : "ghost"}
                    onClick={toggleListening}
                    disabled={isSearching}
                    className={`h-6 px-1.5 text-[10px] shrink-0 ${
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
                    disabled={!searchText.trim() || isSearching || isListening}
                    className="h-6 px-1.5 text-[10px] shrink-0 hover:bg-muted"
                >
                    <BookOpen className="h-3 w-3" />
                </Button>
            </div>

            {error && (
                <Alert variant="destructive" className="py-1 px-2">
                    <AlertCircle className="h-2.5 w-2.5" />
                    <AlertDescription className="flex items-center justify-between text-[10px]">
                        <span>{error}</span>
                        {lastSearchedWord && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRetry}
                                disabled={isSearching}
                                className="ml-1.5 h-5 text-[10px] px-1.5"
                            >
                                <RefreshCw className="mr-0.5 h-2 w-2" />
                                Retry
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {synonyms.length > 0 && (
                <div className="border-t border-border/50 pt-1.5">
                    <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-2.5 w-2.5 text-accent" />
                        <span className="text-[10px] font-medium">
                            {t('synonymSearch.results')} ({synonyms.length})
                        </span>
                    </div>
                    <ScrollArea className="h-20 rounded border border-border/50 bg-muted/30 p-1">
                        <div className="flex flex-wrap gap-1">
                            {synonyms.map((synonym, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSynonymClick(synonym)}
                                    className="px-1.5 py-0.5 text-[10px] rounded bg-card border border-border/50 hover:border-accent hover:bg-accent/10 transition-all cursor-pointer"
                                >
                                    {synonym}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
