import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useGetVoicePreference, useSetVoicePreference, useGetReadingSpeeds, useGetPolishVoices } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface TextToSpeechControlsProps {
    chapterId: string;
    content: string;
    cursorPosition?: number;
}

export function TextToSpeechControls({ chapterId, content, cursorPosition = 0 }: TextToSpeechControlsProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [selectedSpeed, setSelectedSpeed] = useState<string>('normal');
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const { t } = useLanguage();

    const { data: voicePreference } = useGetVoicePreference(chapterId);
    const { data: readingSpeeds } = useGetReadingSpeeds();
    const { data: backendPolishVoices } = useGetPolishVoices();
    const setVoicePreference = useSetVoicePreference();

    // Load available Polish voices from browser
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Filter for Polish voices only (pl-PL)
            const polishVoices = voices.filter(voice => 
                voice.lang.startsWith('pl-PL') || voice.lang.startsWith('pl')
            );
            setAvailableVoices(polishVoices);

            // Set default voice if not already set
            if (polishVoices.length > 0 && !selectedVoice) {
                const defaultVoice = polishVoices[0].name;
                setSelectedVoice(defaultVoice);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [selectedVoice]);

    // Load saved voice preference
    useEffect(() => {
        if (voicePreference?.voice) {
            setSelectedVoice(voicePreference.voice);
        }
        if (voicePreference?.speed) {
            setSelectedSpeed(voicePreference.speed);
        }
    }, [voicePreference]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const getSpeedValue = (speed: string): number => {
        switch (speed) {
            case 'slow':
                return 0.75;
            case 'fast':
                return 1.5;
            case 'very_fast':
                return 2.0;
            default:
                return 1.0;
        }
    };

    const getSpeedLabel = (speed: string): string => {
        switch (speed) {
            case 'slow':
                return t('tts.slow');
            case 'fast':
                return t('tts.fast');
            case 'very_fast':
                return t('tts.veryFast');
            default:
                return t('tts.normal');
        }
    };

    const handlePlay = () => {
        if (!content.trim()) {
            toast.error(t('tts.noContent'));
            return;
        }

        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                setIsPlaying(true);
            } else {
                window.speechSynthesis.pause();
                setIsPlaying(false);
            }
            return;
        }

        // Get text from cursor position to end
        const textToRead = cursorPosition > 0 ? content.substring(cursorPosition) : content;

        if (!textToRead.trim()) {
            toast.error(t('tts.noContentFromCursor'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        const voice = availableVoices.find(v => v.name === selectedVoice);
        
        if (voice) {
            utterance.voice = voice;
        }

        utterance.lang = 'pl-PL';
        utterance.rate = getSpeedValue(selectedSpeed);

        utterance.onend = () => {
            setIsPlaying(false);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            toast.error(t('tts.failed'));
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    };

    const handleVoiceChange = async (voiceName: string) => {
        setSelectedVoice(voiceName);
        
        // Stop current playback if any
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }

        // Save preference to backend
        try {
            await setVoicePreference.mutateAsync({
                chapterId,
                voice: voiceName,
                speed: selectedSpeed,
            });
        } catch (error) {
            toast.error(t('tts.voiceSaveFailed'));
        }
    };

    const handleSpeedChange = async (speed: string) => {
        setSelectedSpeed(speed);
        
        // Stop current playback if any
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }

        // Save preference to backend
        try {
            await setVoicePreference.mutateAsync({
                chapterId,
                voice: selectedVoice,
                speed,
            });
        } catch (error) {
            toast.error(t('tts.speedSaveFailed'));
        }
    };

    // Get voice display name with translation
    const getVoiceDisplayName = (voiceName: string): string => {
        // Special handling for Laura Breszka-style voice
        if (voiceName === 'pl-PL-LauraBreszkaStyle') {
            return t('tts.lauraBreszkaStyle');
        }
        if (voiceName === 'pl-PL-ProfessionalNarrator') {
            return t('tts.professionalNarrator');
        }
        if (voiceName === 'pl-PL-PolishNarrator1') {
            return t('tts.polishNarrator1');
        }
        if (voiceName === 'pl-PL-PolishNarrator2') {
            return t('tts.polishNarrator2');
        }
        if (voiceName === 'pl-PL-PolishFemale1') {
            return t('tts.polishFemale1');
        }
        if (voiceName === 'pl-PL-PolishFemale2') {
            return t('tts.polishFemale2');
        }
        if (voiceName === 'pl-PL-PolishMale1') {
            return t('tts.polishMale1');
        }
        if (voiceName === 'pl-PL-PolishMale2') {
            return t('tts.polishMale2');
        }
        
        // Return original name for browser voices
        return voiceName;
    };

    // Categorize voices from backend
    const categorizeBackendVoices = () => {
        if (!backendPolishVoices) return { narrator: [], female: [], male: [], other: [] };

        const narrator: string[] = [];
        const female: string[] = [];
        const male: string[] = [];
        const other: string[] = [];

        backendPolishVoices.forEach(voiceName => {
            const lowerName = voiceName.toLowerCase();
            if (lowerName.includes('narrator') || lowerName.includes('breszka') || lowerName.includes('professional')) {
                narrator.push(voiceName);
            } else if (lowerName.includes('female') || lowerName.includes('ewa') || 
                       lowerName.includes('zofia') || lowerName.includes('agnieszka') || 
                       lowerName.includes('karolina')) {
                female.push(voiceName);
            } else if (lowerName.includes('male') || lowerName.includes('marek') || 
                       lowerName.includes('jan') || lowerName.includes('tomasz')) {
                male.push(voiceName);
            } else {
                other.push(voiceName);
            }
        });

        return { narrator, female, male, other };
    };

    // Categorize browser voices
    const categorizeBrowserVoices = () => {
        const female: SpeechSynthesisVoice[] = [];
        const male: SpeechSynthesisVoice[] = [];
        const other: SpeechSynthesisVoice[] = [];

        availableVoices.forEach(voice => {
            const lowerName = voice.name.toLowerCase();
            if (lowerName.includes('ewa') || lowerName.includes('zofia') || 
                lowerName.includes('agnieszka') || lowerName.includes('karolina') || 
                lowerName.includes('female')) {
                female.push(voice);
            } else if (lowerName.includes('marek') || lowerName.includes('jan') || 
                       lowerName.includes('tomasz') || lowerName.includes('male')) {
                male.push(voice);
            } else {
                other.push(voice);
            }
        });

        return { female, male, other };
    };

    const backendVoiceCategories = categorizeBackendVoices();
    const browserVoiceCategories = categorizeBrowserVoices();

    const hasVoices = (backendPolishVoices && backendPolishVoices.length > 0) || availableVoices.length > 0;

    return (
        <div className="flex items-center gap-2">
            <Select value={selectedSpeed} onValueChange={handleSpeedChange}>
                <SelectTrigger className="w-[130px] h-9 border-primary/20 hover:border-primary/40 transition-colors">
                    <Gauge className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder={t('tts.speed')} />
                </SelectTrigger>
                <SelectContent className="border-primary/20">
                    {readingSpeeds?.map((speed) => (
                        <SelectItem key={speed} value={speed}>
                            {getSpeedLabel(speed)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                <SelectTrigger className="w-[220px] h-9 border-primary/20 hover:border-primary/40 transition-colors">
                    <Volume2 className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder={t('tts.voice')} />
                </SelectTrigger>
                <SelectContent className="border-primary/20 max-h-[400px]">
                    {!hasVoices && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t('tts.noVoices')}
                        </div>
                    )}
                    
                    {/* Backend Narrator Voices */}
                    {backendVoiceCategories.narrator.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary">
                                {t('tts.narratorVoices')}
                            </div>
                            {backendVoiceCategories.narrator.map((voiceName) => (
                                <SelectItem key={voiceName} value={voiceName}>
                                    {getVoiceDisplayName(voiceName)}
                                </SelectItem>
                            ))}
                        </>
                    )}

                    {/* Backend Female Voices */}
                    {backendVoiceCategories.female.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary">
                                {t('tts.femaleVoices')}
                            </div>
                            {backendVoiceCategories.female.map((voiceName) => (
                                <SelectItem key={voiceName} value={voiceName}>
                                    {getVoiceDisplayName(voiceName)}
                                </SelectItem>
                            ))}
                        </>
                    )}

                    {/* Browser Female Voices */}
                    {browserVoiceCategories.female.length > 0 && (
                        <>
                            {backendVoiceCategories.female.length === 0 && (
                                <div className="px-2 py-1.5 text-xs font-semibold text-primary">
                                    {t('tts.femaleVoices')}
                                </div>
                            )}
                            {browserVoiceCategories.female.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </>
                    )}

                    {/* Backend Male Voices */}
                    {backendVoiceCategories.male.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {t('tts.maleVoices')}
                            </div>
                            {backendVoiceCategories.male.map((voiceName) => (
                                <SelectItem key={voiceName} value={voiceName}>
                                    {getVoiceDisplayName(voiceName)}
                                </SelectItem>
                            ))}
                        </>
                    )}

                    {/* Browser Male Voices */}
                    {browserVoiceCategories.male.length > 0 && (
                        <>
                            {backendVoiceCategories.male.length === 0 && (
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {t('tts.maleVoices')}
                                </div>
                            )}
                            {browserVoiceCategories.male.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </>
                    )}

                    {/* Backend Other Voices */}
                    {backendVoiceCategories.other.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {t('tts.otherVoices')}
                            </div>
                            {backendVoiceCategories.other.map((voiceName) => (
                                <SelectItem key={voiceName} value={voiceName}>
                                    {getVoiceDisplayName(voiceName)}
                                </SelectItem>
                            ))}
                        </>
                    )}

                    {/* Browser Other Voices */}
                    {browserVoiceCategories.other.length > 0 && (
                        <>
                            {backendVoiceCategories.other.length === 0 && 
                             (backendVoiceCategories.narrator.length > 0 || 
                              backendVoiceCategories.female.length > 0 || 
                              backendVoiceCategories.male.length > 0 ||
                              browserVoiceCategories.female.length > 0 || 
                              browserVoiceCategories.male.length > 0) && (
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {t('tts.otherVoices')}
                                </div>
                            )}
                            {browserVoiceCategories.other.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </>
                    )}
                </SelectContent>
            </Select>

            <Button
                variant="outline"
                size="sm"
                onClick={isPlaying ? handleStop : handlePlay}
                disabled={!content.trim() || !hasVoices}
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
                {isPlaying ? (
                    <>
                        <Pause className="mr-2 h-4 w-4 text-primary" />
                        {t('tts.pause')}
                    </>
                ) : (
                    <>
                        <Play className="mr-2 h-4 w-4 text-primary" />
                        {t('tts.play')}
                    </>
                )}
            </Button>
        </div>
    );
}
