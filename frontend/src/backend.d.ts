import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface VoicePreference {
    voice: string;
    chapterId: string;
    speed: string;
}
export interface BoldRange {
    end: bigint;
    chapterId: string;
    start: bigint;
}
export interface Highlight {
    end: bigint;
    color: string;
    text: string;
    chapterId: string;
    start: bigint;
}
export interface ExportResult {
    data?: Uint8Array;
    message: string;
    success: boolean;
}
export interface ImageAttachment {
    id: string;
    contentType: string;
    data: ExternalBlob;
    size: bigint;
    filename: string;
}
export interface Chapter {
    id: string;
    title: string;
    content: string;
    characterCount: bigint;
    bookId: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Book {
    id: string;
    title: string;
    description: string;
}
export interface Annotation {
    id: string;
    content: string;
    chapterId: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAnnotation(id: string, chapterId: string, content: string): Promise<void>;
    addAttachmentToChapter(chapterId: string, imageId: string): Promise<void>;
    addBoldRange(chapterId: string, start: bigint, end: bigint): Promise<void>;
    addHighlight(chapterId: string, start: bigint, end: bigint, color: string, text: string): Promise<void>;
    adjustBoldRanges(chapterId: string, editPosition: bigint, editLength: bigint): Promise<void>;
    adjustHighlights(chapterId: string, editPosition: bigint, editLength: bigint): Promise<void>;
    analyzePolishWriting(text: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkEnglishSpelling(text: string): Promise<string>;
    checkPolishSpelling(text: string): Promise<string>;
    clearBoldRanges(chapterId: string): Promise<void>;
    clearHighlights(chapterId: string): Promise<void>;
    createBook(id: string, title: string, description: string): Promise<void>;
    createChapter(id: string, bookId: string, title: string, content: string): Promise<void>;
    deleteAnnotation(id: string): Promise<void>;
    deleteBook(id: string): Promise<void>;
    deleteChapter(id: string): Promise<void>;
    deleteImageAttachment(imageId: string): Promise<void>;
    exportChapterAsDocx(chapterId: string): Promise<ExportResult>;
    exportChapterAsPdf(chapterId: string): Promise<ExportResult>;
    getAllBooks(): Promise<Array<Book>>;
    getAnnotationsForChapter(chapterId: string): Promise<Array<Annotation>>;
    getAttachmentsForChapter(chapterId: string): Promise<Array<string>>;
    getAvailableFonts(): Promise<Array<string>>;
    getBoldRanges(chapterId: string): Promise<Array<BoldRange>>;
    getBook(id: string): Promise<Book | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChapter(id: string): Promise<Chapter | null>;
    getChaptersForBook(bookId: string): Promise<Array<Chapter>>;
    getCharacterCount(chapterId: string): Promise<bigint | null>;
    getHighlightColors(): Promise<Array<string>>;
    getHighlights(chapterId: string): Promise<Array<Highlight>>;
    getImageAttachment(imageId: string): Promise<ImageAttachment | null>;
    getPolishVoices(): Promise<Array<string>>;
    getReadingSpeeds(): Promise<Array<string>>;
    getUserLanguagePreference(): Promise<string | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVoicePreference(chapterId: string): Promise<VoicePreference | null>;
    improveText(text: string, language: string): Promise<string>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listImageAttachments(): Promise<Array<ImageAttachment>>;
    removeBoldRange(chapterId: string, start: bigint, end: bigint): Promise<void>;
    removeHighlight(chapterId: string, start: bigint, end: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchSynonymsWithVoiceInput(spokenWord: string): Promise<Array<string>>;
    searchWithVoiceInput(chapterId: string, spokenWord: string): Promise<string | null>;
    setUserLanguagePreference(language: string): Promise<void>;
    setVoicePreference(chapterId: string, voice: string, speed: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAnnotation(id: string, content: string): Promise<void>;
    updateBook(id: string, title: string, description: string): Promise<void>;
    updateChapter(id: string, bookId: string, title: string, content: string): Promise<void>;
    uploadImageAttachment(filename: string, contentType: string, content: Uint8Array): Promise<string>;
}
