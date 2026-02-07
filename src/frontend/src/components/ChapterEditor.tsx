import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Save, MessageSquare, CheckCircle2, Lightbulb, Download, Type, FileText, Highlighter, Eraser, Wand2, Bold, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  useGetChapter,
  useUpdateChapter,
  useCheckPolishSpelling,
  useCheckEnglishSpelling,
  useAnalyzePolishWriting,
  useImproveText,
  useUploadImageAttachment,
  useAddAttachmentToChapter,
  useExportChapterAsPdf,
  useExportChapterAsDocx,
} from '../hooks/useQueries';
import { useLanguage } from '../contexts/LanguageContext';
import { useActor } from '../hooks/useActor';
import { AnnotationsPanel } from './AnnotationsPanel';
import { WritingAnalysisPanel } from './WritingAnalysisPanel';
import { TextToSpeechControls } from './TextToSpeechControls';
import { VoiceSearchField } from './VoiceSearchField';
import { SynonymSearchField } from './SynonymSearchField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createAttachmentReference, findAttachmentImages, markImageAsResolved } from '../lib/quillAttachments';
import { downloadFile, sanitizeFilename } from '../lib/fileDownload';
import { getExportErrorReason } from '../lib/exportError';

interface ChapterEditorProps {
  chapterId: string;
  bookId: string;
}

export default function ChapterEditor({ chapterId, bookId }: ChapterEditorProps) {
  const { t, language } = useLanguage();
  const { actor } = useActor();
  const { data: chapter, isLoading } = useGetChapter(chapterId);
  const updateChapter = useUpdateChapter();
  const checkPolishSpelling = useCheckPolishSpelling();
  const checkEnglishSpelling = useCheckEnglishSpelling();
  const analyzeWriting = useAnalyzePolishWriting();
  const improveText = useImproveText();
  const uploadImageAttachment = useUploadImageAttachment();
  const addAttachmentToChapter = useAddAttachmentToChapter();
  const exportPdf = useExportChapterAsPdf();
  const exportDocx = useExportChapterAsDocx();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ index: number; length: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setContent(chapter.content);
    }
  }, [chapter]);

  // Resolve attachment images after content is loaded
  useEffect(() => {
    if (!content || !actor) return;

    const resolveImages = async () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const attachmentImages = findAttachmentImages(doc.body);

      for (const img of attachmentImages) {
        const attachmentId = img.getAttribute('data-attachment-id');
        if (!attachmentId) continue;

        try {
          const attachment = await actor.getImageAttachment(attachmentId);
          if (attachment) {
            const bytes = await attachment.data.getBytes();
            const blob = new Blob([bytes], { type: attachment.contentType });
            const url = URL.createObjectURL(blob);
            img.src = url;
            markImageAsResolved(img);
          }
        } catch (error) {
          console.error('Failed to resolve attachment:', error);
        }
      }

      const updatedContent = doc.body.innerHTML;
      if (updatedContent !== content) {
        setContent(updatedContent);
      }
    };

    resolveImages();
  }, [content, actor]);

  const handleSave = async () => {
    if (!chapter) return;

    setIsSaving(true);
    try {
      await updateChapter.mutateAsync({
        id: chapterId,
        bookId,
        title,
        content,
      });
      toast.success(t('editor.saved'));
    } catch (error) {
      console.error('Failed to save chapter:', error);
      toast.error(t('editor.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpellCheck = async () => {
    if (!content) {
      toast.error(t('editor.noContent'));
      return;
    }

    setIsChecking(true);
    try {
      const result = language === 'pl'
        ? await checkPolishSpelling.mutateAsync(content)
        : await checkEnglishSpelling.mutateAsync(content);
      
      toast.success(t('editor.analysisComplete'));
    } catch (error) {
      console.error('Spell check failed:', error);
      toast.error(t('editor.analysisFailed'));
    } finally {
      setIsChecking(false);
    }
  };

  const handleAnalyze = async () => {
    if (!content) {
      toast.error(t('editor.noContentAnalyze'));
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysis(true);
    try {
      const result = await analyzeWriting.mutateAsync(content);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(t('editor.analysisFailed'));
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImprove = async () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection || selection.length === 0) {
      toast.error(t('improve.noSelection'));
      return;
    }

    const selectedText = quill.getText(selection.index, selection.length);
    setOriginalText(selectedText);
    setSelectionRange(selection);

    try {
      const result = await improveText.mutateAsync({
        text: selectedText,
        language,
      });
      setImprovedText(result);
      setShowImproveDialog(true);
    } catch (error) {
      console.error('Text improvement failed:', error);
      toast.error(t('improve.failed'));
    }
  };

  const handleAcceptImprovement = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill || !selectionRange) return;

    quill.deleteText(selectionRange.index, selectionRange.length);
    quill.insertText(selectionRange.index, improvedText);
    
    setShowImproveDialog(false);
    toast.success(t('improve.accepted'));
  };

  const handleImageInsert = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('editor.invalidImageType'));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('editor.imageTooLarge'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const imageId = await uploadImageAttachment.mutateAsync({
        filename: file.name,
        contentType: file.type,
        content: uint8Array,
        onProgress: (percentage) => setUploadProgress(percentage),
      });

      await addAttachmentToChapter.mutateAsync({
        chapterId,
        imageId,
      });

      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        const attachmentRef = createAttachmentReference(imageId);
        quill.insertEmbed(range.index, 'image', attachmentRef);
        quill.setSelection(range.index + 1, 0);
      }

      toast.success(t('editor.imageInserted'));
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(t('editor.imageUploadFailed'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportPdf = async () => {
    if (!chapter) {
      toast.error('Chapter not found');
      return;
    }

    // Prevent duplicate exports
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      // Auto-save before export if there are changes
      if (title !== chapter.title || content !== chapter.content) {
        await updateChapter.mutateAsync({
          id: chapterId,
          bookId,
          title,
          content,
        });
      }

      const result = await exportPdf.mutateAsync(chapterId);
      
      if (!result || result.length === 0) {
        toast.error('Export failed: Empty response from server');
        return;
      }

      const filename = sanitizeFilename(title || 'chapter') + '.pdf';
      downloadFile(result, filename, 'application/pdf');
      toast.success('Export to PDF successful');
    } catch (error) {
      console.error('PDF export failed:', error);
      const reason = getExportErrorReason(error);
      toast.error(`Export failed: ${reason}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    if (!chapter) {
      toast.error('Chapter not found');
      return;
    }

    // Prevent duplicate exports
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      // Auto-save before export if there are changes
      if (title !== chapter.title || content !== chapter.content) {
        await updateChapter.mutateAsync({
          id: chapterId,
          bookId,
          title,
          content,
        });
      }

      const result = await exportDocx.mutateAsync(chapterId);
      
      if (!result || result.length === 0) {
        toast.error('Export failed: Empty response from server');
        return;
      }

      const filename = sanitizeFilename(title || 'chapter') + '.docx';
      downloadFile(result, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      toast.success('Export to DOCX successful');
    } catch (error) {
      console.error('DOCX export failed:', error);
      const reason = getExportErrorReason(error);
      toast.error(`Export failed: ${reason}`);
    } finally {
      setIsExporting(false);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link'],
          ['clean'],
        ],
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('editor.loading')}</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('editor.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-2 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('editor.titlePlaceholder')}
          className="flex-1 h-8 text-sm"
        />
        <Button
          onClick={handleSave}
          disabled={isSaving || isExporting}
          size="sm"
          className="h-8"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {isSaving ? t('editor.saving') : t('editor.save')}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
        <Button
          onClick={handleImageInsert}
          disabled={isUploading || isExporting}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
          {isUploading ? `${t('editor.uploading')} ${uploadProgress}%` : t('editor.insertImage')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
        <Separator orientation="vertical" className="h-5" />
        <Button
          onClick={handleSpellCheck}
          disabled={isChecking || isExporting}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          {isChecking ? t('editor.checking') : t('editor.spellCheck')}
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isExporting}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
          {t('editor.analyze')}
        </Button>
        <Button
          onClick={handleImprove}
          disabled={improveText.isPending || isExporting}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          <Wand2 className="w-3.5 h-3.5 mr-1.5" />
          {t('editor.improve')}
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Button
          onClick={() => setShowAnnotations(!showAnnotations)}
          disabled={isExporting}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          {t('editor.annotations')}
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isExporting}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {isExporting ? t('editor.exporting') : t('editor.export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>
              <FileText className="w-3.5 h-3.5 mr-2" />
              {t('editor.exportPdf')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportDocx} disabled={isExporting}>
              <FileText className="w-3.5 h-3.5 mr-2" />
              {t('editor.exportDocx')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="h-5" />
        <VoiceSearchField chapterId={chapterId} content={content} />
        <SynonymSearchField />
      </div>

      <div className="flex-1 overflow-hidden">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder={t('editor.contentPlaceholder')}
          className="h-full quill-editor"
        />
      </div>

      <div className="border-t bg-muted/30 p-2">
        <TextToSpeechControls chapterId={chapterId} content={content} />
      </div>

      {showAnnotations && (
        <div className="absolute right-0 top-0 bottom-0 w-80 border-l bg-background shadow-lg z-10">
          <AnnotationsPanel chapterId={chapterId} />
        </div>
      )}

      {showAnalysis && (
        <div className="absolute right-0 top-0 bottom-0 z-10">
          <WritingAnalysisPanel
            analysisResult={analysisResult}
            isAnalyzing={isAnalyzing}
            onClose={() => setShowAnalysis(false)}
          />
        </div>
      )}

      <Dialog open={showImproveDialog} onOpenChange={setShowImproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('improve.title')}</DialogTitle>
            <DialogDescription>{t('improve.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">{t('improve.original')}</h4>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {originalText}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">{t('improve.improved')}</h4>
              <p className="text-sm p-3 bg-primary/5 rounded-md border border-primary/20">
                {improvedText}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImproveDialog(false)}>
              {t('improve.cancel')}
            </Button>
            <Button onClick={handleAcceptImprovement}>
              {t('improve.accept')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
