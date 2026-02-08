import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Book, Chapter, Annotation, VoicePreference, Highlight, BoldRange, UserProfile, ImageAttachment } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllBooks() {
  const { actor, isFetching } = useActor();

  return useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBooks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBook(id, title, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBook(id, title, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useDeleteBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useGetBook(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Book | null>({
    queryKey: ['book', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBook(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetChaptersForBook(bookId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Chapter[]>({
    queryKey: ['chapters', bookId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChaptersForBook(bookId);
    },
    enabled: !!actor && !isFetching && !!bookId,
  });
}

export function useCreateChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookId, title, content }: { id: string; bookId: string; title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChapter(id, bookId, title, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.bookId] });
    },
  });
}

export function useGetChapter(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Chapter | null>({
    queryKey: ['chapter', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getChapter(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useUpdateChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookId, title, content }: { id: string; bookId: string; title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateChapter(id, bookId, title, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapter', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.bookId] });
    },
  });
}

export function useDeleteChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteChapter(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.bookId] });
    },
  });
}

export function useGetAnnotationsForChapter(chapterId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Annotation[]>({
    queryKey: ['annotations', chapterId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAnnotationsForChapter(chapterId);
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

export function useAddAnnotation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, chapterId, content }: { id: string; chapterId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAnnotation(id, chapterId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['annotations', variables.chapterId] });
    },
  });
}

export function useUpdateAnnotation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content, chapterId }: { id: string; content: string; chapterId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAnnotation(id, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['annotations', variables.chapterId] });
    },
  });
}

export function useDeleteAnnotation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, chapterId }: { id: string; chapterId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAnnotation(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['annotations', variables.chapterId] });
    },
  });
}

export function useCheckPolishSpelling() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkPolishSpelling(text);
    },
  });
}

export function useCheckEnglishSpelling() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkEnglishSpelling(text);
    },
  });
}

export function useAnalyzePolishWriting() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.analyzePolishWriting(text);
    },
  });
}

export function useImproveText() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ text, language }: { text: string; language: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.improveText(text, language);
    },
  });
}

export function useGetVoicePreference(chapterId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<VoicePreference | null>({
    queryKey: ['voicePreference', chapterId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVoicePreference(chapterId);
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

export function useSetVoicePreference() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, voice, speed }: { chapterId: string; voice: string; speed: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setVoicePreference(chapterId, voice, speed);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voicePreference', variables.chapterId] });
    },
  });
}

export function useGetAvailableFonts() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['availableFonts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableFonts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserLanguagePreference() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['userLanguagePreference'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserLanguagePreference();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetUserLanguagePreference() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (language: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserLanguagePreference(language);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLanguagePreference'] });
    },
  });
}

export function useGetHighlights(chapterId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Highlight[]>({
    queryKey: ['highlights', chapterId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHighlights(chapterId);
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

export function useAddHighlight() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, start, end, color, text }: { chapterId: string; start: number; end: number; color: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addHighlight(chapterId, BigInt(start), BigInt(end), color, text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', variables.chapterId] });
    },
  });
}

export function useRemoveHighlight() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, start, end }: { chapterId: string; start: number; end: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeHighlight(chapterId, BigInt(start), BigInt(end));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', variables.chapterId] });
    },
  });
}

export function useAdjustHighlights() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, editPosition, editLength }: { chapterId: string; editPosition: number; editLength: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adjustHighlights(chapterId, BigInt(editPosition), BigInt(editLength));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', variables.chapterId] });
    },
  });
}

export function useGetBoldRanges(chapterId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BoldRange[]>({
    queryKey: ['boldRanges', chapterId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBoldRanges(chapterId);
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

export function useAddBoldRange() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, start, end }: { chapterId: string; start: number; end: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBoldRange(chapterId, BigInt(start), BigInt(end));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boldRanges', variables.chapterId] });
    },
  });
}

export function useRemoveBoldRange() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, start, end }: { chapterId: string; start: number; end: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeBoldRange(chapterId, BigInt(start), BigInt(end));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boldRanges', variables.chapterId] });
    },
  });
}

export function useAdjustBoldRanges() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, editPosition, editLength }: { chapterId: string; editPosition: number; editLength: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adjustBoldRanges(chapterId, BigInt(editPosition), BigInt(editLength));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boldRanges', variables.chapterId] });
    },
  });
}

// Image Attachment Hooks
export function useUploadImageAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ filename, contentType, content, onProgress }: { filename: string; contentType: string; content: Uint8Array; onProgress?: (percentage: number) => void }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Pass Uint8Array directly to backend
      return actor.uploadImageAttachment(filename, contentType, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imageAttachments'] });
    },
  });
}

export function useGetImageAttachment(imageId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ImageAttachment | null>({
    queryKey: ['imageAttachment', imageId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getImageAttachment(imageId);
    },
    enabled: !!actor && !isFetching && !!imageId,
  });
}

export function useListImageAttachments() {
  const { actor, isFetching } = useActor();

  return useQuery<ImageAttachment[]>({
    queryKey: ['imageAttachments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listImageAttachments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAttachmentToChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, imageId }: { chapterId: string; imageId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAttachmentToChapter(chapterId, imageId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapterAttachments', variables.chapterId] });
    },
  });
}

export function useGetAttachmentsForChapter(chapterId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['chapterAttachments', chapterId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttachmentsForChapter(chapterId);
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

// Voice search hook
export function useSearchWithVoiceInput() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ chapterId, spokenWord }: { chapterId: string; spokenWord: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchWithVoiceInput(chapterId, spokenWord);
    },
  });
}

// Polish voices hook
export function useGetPolishVoices() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['polishVoices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPolishVoices();
    },
    enabled: !!actor && !isFetching,
  });
}

// Reading speeds hook
export function useGetReadingSpeeds() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['readingSpeeds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReadingSpeeds();
    },
    enabled: !!actor && !isFetching,
  });
}

// Export response type
export type ExportResponse = {
  success: boolean;
  message: string;
  data?: Uint8Array;
};

// Export hooks - return the full response object from backend
export function useExportChapterAsPdf() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (chapterId: string): Promise<ExportResponse> => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportChapterAsPdf(chapterId);
    },
  });
}

export function useExportChapterAsDocx() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (chapterId: string): Promise<ExportResponse> => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportChapterAsDocx(chapterId);
    },
  });
}
