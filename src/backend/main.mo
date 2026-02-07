import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import OutCall "http-outcalls/outcall";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Int "mo:base/Int";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {

  // Storage initialization
  let storage = Storage.new();
  include MixinStorage(storage);

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  type ImageAttachment = {
    id : Text;
    filename : Text;
    contentType : Text;
    size : Nat;
    data : Storage.ExternalBlob; // Store external blob reference
  };

  var imageAttachments = principalMap.empty<OrderedMap.Map<Text, ImageAttachment>>();
  var chapterAttachments = principalMap.empty<OrderedMap.Map<Text, [Text]>>();

  var books : OrderedMap.Map<Principal, OrderedMap.Map<Text, Book>> = principalMap.empty();
  var chapters : OrderedMap.Map<Principal, OrderedMap.Map<Text, Chapter>> = principalMap.empty();
  var annotations : OrderedMap.Map<Principal, OrderedMap.Map<Text, Annotation>> = principalMap.empty();
  var voicePreferences : OrderedMap.Map<Principal, OrderedMap.Map<Text, VoicePreference>> = principalMap.empty();
  var userPreferences : OrderedMap.Map<Principal, UserPreference> = principalMap.empty();
  var highlights : OrderedMap.Map<Principal, OrderedMap.Map<Text, [Highlight]>> = principalMap.empty();
  var boldFormatting : OrderedMap.Map<Principal, OrderedMap.Map<Text, [BoldRange]>> = principalMap.empty();
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();

  let accessControlState = AccessControl.initState();

  type Book = {
    id : Text;
    title : Text;
    description : Text;
  };

  type Chapter = {
    id : Text;
    bookId : Text;
    title : Text;
    content : Text;
    characterCount : Nat;
  };

  type Annotation = {
    id : Text;
    chapterId : Text;
    content : Text;
  };

  type VoicePreference = {
    chapterId : Text;
    voice : Text;
    speed : Text;
  };

  type UserPreference = {
    language : Text;
  };

  type Highlight = {
    start : Nat;
    end : Nat;
    color : Text;
    text : Text;
    chapterId : Text;
  };

  type BoldRange = {
    start : Nat;
    end : Nat;
    chapterId : Text;
  };

  type UserProfile = {
    name : Text;
  };

  // Access Control Functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  // Image Attachment APIs
  public shared ({ caller }) func uploadImageAttachment(filename : Text, contentType : Text, content : Blob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can upload attachments");
    };

    let imageId = Text.concat(filename, Int.toText(Time.now()));
    let size = content.size();

    let attachment : ImageAttachment = {
      id = imageId;
      filename;
      contentType;
      size;
      data = content;
    };

    let userAttachments = switch (principalMap.get(imageAttachments, caller)) {
      case (?a) { a };
      case null { textMap.empty<ImageAttachment>() };
    };

    let updatedUserAttachments = textMap.put(userAttachments, imageId, attachment);
    imageAttachments := principalMap.put(imageAttachments, caller, updatedUserAttachments);

    imageId;
  };

  public query ({ caller }) func getImageAttachment(imageId : Text) : async ?ImageAttachment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access attachments");
    };

    switch (principalMap.get(imageAttachments, caller)) {
      case (?userAttachments) { textMap.get(userAttachments, imageId) };
      case null { null };
    };
  };

  public query ({ caller }) func listImageAttachments() : async [ImageAttachment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can list attachments");
    };

    switch (principalMap.get(imageAttachments, caller)) {
      case (?userAttachments) { Iter.toArray(textMap.vals(userAttachments)) };
      case null { [] };
    };
  };

  public shared ({ caller }) func deleteImageAttachment(imageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete attachments");
    };

    switch (principalMap.get(imageAttachments, caller)) {
      case (?userAttachments) {
        let updatedUserAttachments = textMap.delete(userAttachments, imageId);
        imageAttachments := principalMap.put(imageAttachments, caller, updatedUserAttachments);
      };
      case null {};
    };
  };

  // Attachment Management for Chapters
  public shared ({ caller }) func addAttachmentToChapter(chapterId : Text, imageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add attachments to chapters");
    };

    let userAttachments = switch (principalMap.get(chapterAttachments, caller)) {
      case (?a) { a };
      case null { textMap.empty<[Text]>() };
    };

    let existingAttachments = switch (textMap.get(userAttachments, chapterId)) {
      case (?a) { a };
      case null { [] };
    };

    let updatedAttachments = Array.append(existingAttachments, [imageId]);
    let updatedUserAttachments = textMap.put(userAttachments, chapterId, updatedAttachments);
    chapterAttachments := principalMap.put(chapterAttachments, caller, updatedUserAttachments);
  };

  public query ({ caller }) func getAttachmentsForChapter(chapterId : Text) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access chapter attachments");
    };

    switch (principalMap.get(chapterAttachments, caller)) {
      case (?userAttachments) {
        switch (textMap.get(userAttachments, chapterId)) {
          case (?attachments) { attachments };
          case null { [] };
        };
      };
      case null { [] };
    };
  };

  // Book Management
  public shared ({ caller }) func createBook(id : Text, title : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create books");
    };

    let book : Book = {
      id;
      title;
      description;
    };

    let userBooks = switch (principalMap.get(books, caller)) {
      case (?b) { b };
      case null { textMap.empty<Book>() };
    };

    let updatedUserBooks = textMap.put(userBooks, id, book);
    books := principalMap.put(books, caller, updatedUserBooks);
  };

  public query ({ caller }) func getBook(id : Text) : async ?Book {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access books");
    };

    switch (principalMap.get(books, caller)) {
      case (?userBooks) { textMap.get(userBooks, id) };
      case null { null };
    };
  };

  public shared ({ caller }) func updateBook(id : Text, title : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update books");
    };

    let book : Book = {
      id;
      title;
      description;
    };

    let userBooks = switch (principalMap.get(books, caller)) {
      case (?b) { b };
      case null { textMap.empty<Book>() };
    };

    let updatedUserBooks = textMap.put(userBooks, id, book);
    books := principalMap.put(books, caller, updatedUserBooks);
  };

  public shared ({ caller }) func deleteBook(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete books");
    };

    switch (principalMap.get(books, caller)) {
      case (?userBooks) {
        let updatedUserBooks = textMap.delete(userBooks, id);
        books := principalMap.put(books, caller, updatedUserBooks);
      };
      case null {};
    };
  };

  public query ({ caller }) func getAllBooks() : async [Book] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access books");
    };

    switch (principalMap.get(books, caller)) {
      case (?userBooks) { Iter.toArray(textMap.vals(userBooks)) };
      case null { [] };
    };
  };

  // Chapter Management
  public shared ({ caller }) func createChapter(id : Text, bookId : Text, title : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create chapters");
    };

    let chapter : Chapter = {
      id;
      bookId;
      title;
      content;
      characterCount = Text.size(content);
    };

    let userChapters = switch (principalMap.get(chapters, caller)) {
      case (?c) { c };
      case null { textMap.empty<Chapter>() };
    };

    let updatedUserChapters = textMap.put(userChapters, id, chapter);
    chapters := principalMap.put(chapters, caller, updatedUserChapters);
  };

  public query ({ caller }) func getChapter(id : Text) : async ?Chapter {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access chapters");
    };

    switch (principalMap.get(chapters, caller)) {
      case (?userChapters) { textMap.get(userChapters, id) };
      case null { null };
    };
  };

  public shared ({ caller }) func updateChapter(id : Text, bookId : Text, title : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update chapters");
    };

    let chapter : Chapter = {
      id;
      bookId;
      title;
      content;
      characterCount = Text.size(content);
    };

    let userChapters = switch (principalMap.get(chapters, caller)) {
      case (?c) { c };
      case null { textMap.empty<Chapter>() };
    };

    let updatedUserChapters = textMap.put(userChapters, id, chapter);
    chapters := principalMap.put(chapters, caller, updatedUserChapters);
  };

  public shared ({ caller }) func deleteChapter(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete chapters");
    };

    // Delete the chapter
    switch (principalMap.get(chapters, caller)) {
      case (?userChapters) {
        let updatedUserChapters = textMap.delete(userChapters, id);
        chapters := principalMap.put(chapters, caller, updatedUserChapters);
      };
      case null {};
    };

    // Clean up associated attachments to prevent orphaned images
    switch (principalMap.get(chapterAttachments, caller)) {
      case (?userAttachments) {
        let updatedUserAttachments = textMap.delete(userAttachments, id);
        chapterAttachments := principalMap.put(chapterAttachments, caller, updatedUserAttachments);
      };
      case null {};
    };
  };

  public query ({ caller }) func getChaptersForBook(bookId : Text) : async [Chapter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access chapters");
    };

    switch (principalMap.get(chapters, caller)) {
      case (?userChapters) {
        Iter.toArray(
          Iter.filter(
            textMap.vals(userChapters),
            func(c : Chapter) : Bool { c.bookId == bookId },
          )
        );
      };
      case null { [] };
    };
  };

  // Annotation Management
  public shared ({ caller }) func addAnnotation(id : Text, chapterId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add annotations");
    };

    let annotation : Annotation = {
      id;
      chapterId;
      content;
    };

    let userAnnotations = switch (principalMap.get(annotations, caller)) {
      case (?a) { a };
      case null { textMap.empty<Annotation>() };
    };

    let updatedUserAnnotations = textMap.put(userAnnotations, id, annotation);
    annotations := principalMap.put(annotations, caller, updatedUserAnnotations);
  };

  public query ({ caller }) func getAnnotationsForChapter(chapterId : Text) : async [Annotation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access annotations");
    };

    switch (principalMap.get(annotations, caller)) {
      case (?userAnnotations) {
        Iter.toArray(
          Iter.filter(
            textMap.vals(userAnnotations),
            func(a : Annotation) : Bool { a.chapterId == chapterId },
          )
        );
      };
      case null { [] };
    };
  };

  public shared ({ caller }) func updateAnnotation(id : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update annotations");
    };

    switch (principalMap.get(annotations, caller)) {
      case (?userAnnotations) {
        switch (textMap.get(userAnnotations, id)) {
          case (?annotation) {
            let updatedAnnotation : Annotation = {
              id;
              chapterId = annotation.chapterId;
              content;
            };
            let updatedUserAnnotations = textMap.put(userAnnotations, id, updatedAnnotation);
            annotations := principalMap.put(annotations, caller, updatedUserAnnotations);
          };
          case null {};
        };
      };
      case null {};
    };
  };

  public shared ({ caller }) func deleteAnnotation(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete annotations");
    };

    switch (principalMap.get(annotations, caller)) {
      case (?userAnnotations) {
        let updatedUserAnnotations = textMap.delete(userAnnotations, id);
        annotations := principalMap.put(annotations, caller, updatedUserAnnotations);
      };
      case null {};
    };
  };

  // Character Count
  public query ({ caller }) func getCharacterCount(chapterId : Text) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access character counts");
    };

    switch (principalMap.get(chapters, caller)) {
      case (?userChapters) {
        switch (textMap.get(userChapters, chapterId)) {
          case (?chapter) { ?chapter.characterCount };
          case null { null };
        };
      };
      case null { null };
    };
  };

  // Voice Preferences
  public shared ({ caller }) func setVoicePreference(chapterId : Text, voice : Text, speed : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can set voice preferences");
    };

    let preference : VoicePreference = {
      chapterId;
      voice;
      speed;
    };

    let userVoicePreferences = switch (principalMap.get(voicePreferences, caller)) {
      case (?v) { v };
      case null { textMap.empty<VoicePreference>() };
    };

    let updatedUserVoicePreferences = textMap.put(userVoicePreferences, chapterId, preference);
    voicePreferences := principalMap.put(voicePreferences, caller, updatedUserVoicePreferences);
  };

  public query ({ caller }) func getVoicePreference(chapterId : Text) : async ?VoicePreference {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access voice preferences");
    };

    switch (principalMap.get(voicePreferences, caller)) {
      case (?userVoicePreferences) { textMap.get(userVoicePreferences, chapterId) };
      case null { null };
    };
  };

  public func getPolishVoices() : async [Text] {
    [
      "pl-PL-EwaNeural",
      "pl-PL-MarekNeural",
      "pl-PL-ZofiaNeural",
      "pl-PL-AgnieszkaNeural",
      "pl-PL-JanNeural",
      "pl-PL-KarolinaNeural",
      "pl-PL-TomaszNeural",
      "pl-PL-LauraBreszkaStyle",
      "pl-PL-ProfessionalNarrator",
      "pl-PL-PolishFemale1",
      "pl-PL-PolishFemale2",
      "pl-PL-PolishMale1",
      "pl-PL-PolishMale2",
      "pl-PL-PolishNarrator1",
      "pl-PL-PolishNarrator2",
    ];
  };

  // Font Preferences
  public func getAvailableFonts() : async [Text] {
    [
      "Arial",
      "Calibri",
      "Cambria",
      "Comic Sans MS",
      "Consolas",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Lucida Console",
      "Palatino Linotype",
      "Segoe UI",
      "Tahoma",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
    ];
  };

  // Reading Speeds
  public func getReadingSpeeds() : async [Text] {
    ["slow", "normal", "fast", "very_fast"];
  };

  // User Preferences
  public shared ({ caller }) func setUserLanguagePreference(language : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can set language preferences");
    };

    let preference : UserPreference = {
      language;
    };
    userPreferences := principalMap.put(userPreferences, caller, preference);
  };

  public query ({ caller }) func getUserLanguagePreference() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access language preferences");
    };

    switch (principalMap.get(userPreferences, caller)) {
      case (?preference) { ?preference.language };
      case null { null };
    };
  };

  // Highlight Management
  public shared ({ caller }) func addHighlight(chapterId : Text, start : Nat, end : Nat, color : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add highlights");
    };

    let newHighlight : Highlight = {
      start;
      end;
      color;
      text;
      chapterId;
    };

    let userHighlights = switch (principalMap.get(highlights, caller)) {
      case (?h) { h };
      case null { textMap.empty<[Highlight]>() };
    };

    let existingHighlights = switch (textMap.get(userHighlights, chapterId)) {
      case (?h) { h };
      case null { [] };
    };

    let updatedHighlights = Array.append(existingHighlights, [newHighlight]);
    let updatedUserHighlights = textMap.put(userHighlights, chapterId, updatedHighlights);
    highlights := principalMap.put(highlights, caller, updatedUserHighlights);
  };

  public shared ({ caller }) func removeHighlight(chapterId : Text, start : Nat, end : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can remove highlights");
    };

    switch (principalMap.get(highlights, caller)) {
      case (?userHighlights) {
        switch (textMap.get(userHighlights, chapterId)) {
          case (?chapterHighlights) {
            let filteredHighlights = Iter.toArray(
              Iter.filter(
                chapterHighlights.vals(),
                func(h : Highlight) : Bool {
                  not (h.start == start and h.end == end)
                },
              )
            );
            let updatedUserHighlights = textMap.put(userHighlights, chapterId, filteredHighlights);
            highlights := principalMap.put(highlights, caller, updatedUserHighlights);
          };
          case null {};
        };
      };
      case null {};
    };
  };

  public query ({ caller }) func getHighlights(chapterId : Text) : async [Highlight] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access highlights");
    };

    switch (principalMap.get(highlights, caller)) {
      case (?userHighlights) {
        switch (textMap.get(userHighlights, chapterId)) {
          case (?chapterHighlights) { chapterHighlights };
          case null { [] };
        };
      };
      case null { [] };
    };
  };

  public shared ({ caller }) func clearHighlights(chapterId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can clear highlights");
    };

    switch (principalMap.get(highlights, caller)) {
      case (?userHighlights) {
        let updatedUserHighlights = textMap.delete(userHighlights, chapterId);
        highlights := principalMap.put(highlights, caller, updatedUserHighlights);
      };
      case null {};
    };
  };

  public func getHighlightColors() : async [Text] {
    [
      "#FFD700",
      "#FF69B4",
      "#00CED1",
      "#32CD32",
      "#FFA500",
      "#8A2BE2",
      "#FF4500",
      "#20B2AA",
      "#FF6347",
      "#4682B4",
    ];
  };

  // Bold Formatting Management
  public shared ({ caller }) func addBoldRange(chapterId : Text, start : Nat, end : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add bold formatting");
    };

    let newBoldRange : BoldRange = {
      start;
      end;
      chapterId;
    };

    let userBoldFormatting = switch (principalMap.get(boldFormatting, caller)) {
      case (?b) { b };
      case null { textMap.empty<[BoldRange]>() };
    };

    let existingBoldRanges = switch (textMap.get(userBoldFormatting, chapterId)) {
      case (?b) { b };
      case null { [] };
    };

    let updatedBoldRanges = Array.append(existingBoldRanges, [newBoldRange]);
    let updatedUserBoldFormatting = textMap.put(userBoldFormatting, chapterId, updatedBoldRanges);
    boldFormatting := principalMap.put(boldFormatting, caller, updatedUserBoldFormatting);
  };

  public shared ({ caller }) func removeBoldRange(chapterId : Text, start : Nat, end : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can remove bold formatting");
    };

    switch (principalMap.get(boldFormatting, caller)) {
      case (?userBoldFormatting) {
        switch (textMap.get(userBoldFormatting, chapterId)) {
          case (?chapterBoldRanges) {
            let filteredBoldRanges = Iter.toArray(
              Iter.filter(
                chapterBoldRanges.vals(),
                func(b : BoldRange) : Bool {
                  not (b.start == start and b.end == end)
                },
              )
            );
            let updatedUserBoldFormatting = textMap.put(userBoldFormatting, chapterId, filteredBoldRanges);
            boldFormatting := principalMap.put(boldFormatting, caller, updatedUserBoldFormatting);
          };
          case null {};
        };
      };
      case null {};
    };
  };

  public query ({ caller }) func getBoldRanges(chapterId : Text) : async [BoldRange] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access bold formatting");
    };

    switch (principalMap.get(boldFormatting, caller)) {
      case (?userBoldFormatting) {
        switch (textMap.get(userBoldFormatting, chapterId)) {
          case (?chapterBoldRanges) { chapterBoldRanges };
          case null { [] };
        };
      };
      case null { [] };
    };
  };

  public shared ({ caller }) func clearBoldRanges(chapterId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can clear bold formatting");
    };

    switch (principalMap.get(boldFormatting, caller)) {
      case (?userBoldFormatting) {
        let updatedUserBoldFormatting = textMap.delete(userBoldFormatting, chapterId);
        boldFormatting := principalMap.put(boldFormatting, caller, updatedUserBoldFormatting);
      };
      case null {};
    };
  };

  // HTTP Outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func checkPolishSpelling(text : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can check spelling");
    };

    let url = "https://api.polishspellcheck.com/check?text=" # text;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func analyzePolishWriting(text : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can analyze writing");
    };

    let url = "https://api.polishwritinganalysis.com/analyze?text=" # text;
    await OutCall.httpGetRequest(url, [], transform);
  };

public shared ({ caller }) func exportChapterAsDocx(chapterId : Text) : async ?Blob {
  if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
    Debug.trap("Unauthorized: Only users can export chapters");
  };

  switch (principalMap.get(chapters, caller)) {
    case (?userChapters) {
      switch (textMap.get(userChapters, chapterId)) {
        case (?chapter) {
          let url = "https://api.docxgenerator.com/export?title=" # chapter.title # "&content=" # chapter.content;
          let response = await OutCall.httpGetRequest(url, [], transform);

          // Validate the response (convert to Blob if possible)
          if (Text.size(response) == 0) {
            // Empty response, treat as error but return empty blob
            return ?Text.encodeUtf8(""); // Return empty blob for empty chapters
          };

          let encoded = Text.encodeUtf8(response);
          if (encoded.size() == 0) {
            // Encoding failed, return null to indicate error
            null;
          } else {
            ?encoded; // Return the encoded Blob
          };
        };
        case null { null };
      };
    };
    case null { null };
  };
};

public shared ({ caller }) func exportChapterAsPdf(chapterId : Text) : async ?Blob {
  if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
    Debug.trap("Unauthorized: Only users can export chapters");
  };

  switch (principalMap.get(chapters, caller)) {
    case (?userChapters) {
      switch (textMap.get(userChapters, chapterId)) {
        case (?chapter) {
          let url = "https://api.pdfgenerator.com/export?title=" # chapter.title # "&content=" # chapter.content;
          let response = await OutCall.httpGetRequest(url, [], transform);

          // Validate the response (convert to Blob if possible)
          if (Text.size(response) == 0) {
            // Empty response, treat as error but return empty blob
            return ?Text.encodeUtf8(""); // Return empty blob for empty chapters
          };

          let encoded = Text.encodeUtf8(response);
          if (encoded.size() == 0) {
            // Encoding failed, return null to indicate error
            null;
          } else {
            ?encoded; // Return the encoded Blob
          };
        };
        case null { null };
      };
    };
    case null { null };
  };
};

  public shared ({ caller }) func checkEnglishSpelling(text : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can check spelling");
    };

    let url = "https://api.englishspellcheck.com/check?text=" # text;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func improveText(text : Text, language : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can improve text");
    };

    let url = "https://api.textimprovement.com/improve?text=" # text # "&language=" # language;
    await OutCall.httpGetRequest(url, [], transform);
  };

  // Voice Search and Orthographic Dictionary
  public shared ({ caller }) func searchWithVoiceInput(chapterId : Text, spokenWord : Text) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform voice search");
    };

    let url = "https://api.polishorthographicdictionary.com/check?word=" # spokenWord;
    let correctForm = await OutCall.httpGetRequest(url, [], transform);

    switch (principalMap.get(chapters, caller)) {
      case (?userChapters) {
        switch (textMap.get(userChapters, chapterId)) {
          case (?chapter) {
            if (Text.contains(chapter.content, #text correctForm)) {
              ?correctForm;
            } else {
              null;
            };
          };
          case null { null };
        };
      };
      case null { null };
    };
  };

  // Synonym Search with Voice Input and Error Handling
  public shared ({ caller }) func searchSynonymsWithVoiceInput(spokenWord : Text) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };

    let url = "https://synonimy.pl/synonim/" # spokenWord;
    let response = await OutCall.httpGetRequest(url, [], transform);

    // Check for error messages in the response
    if (Text.contains(response, #text "error") or Text.contains(response, #text "not found")) {
      return [];
    };

    // Assuming the response is a comma-separated list of synonyms
    let synonyms = Text.split(response, #char ',');
    Iter.toArray(synonyms);
  };

  // Dynamic Highlight Adjustment
  public shared ({ caller }) func adjustHighlights(chapterId : Text, editPosition : Nat, editLength : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can adjust highlights");
    };

    switch (principalMap.get(highlights, caller)) {
      case (?userHighlights) {
        switch (textMap.get(userHighlights, chapterId)) {
          case (?chapterHighlights) {
            let adjustedHighlights = Array.map<Highlight, Highlight>(
              chapterHighlights,
              func(h : Highlight) : Highlight {
                if (h.end < editPosition) {
                  h;
                } else if (h.start > editPosition) {
                  {
                    h with
                    start = Nat.add(h.start, editLength);
                    end = Nat.add(h.end, editLength);
                  };
                } else {
                  {
                    h with
                    end = Nat.add(h.end, editLength);
                  };
                };
              },
            );
            let updatedUserHighlights = textMap.put(userHighlights, chapterId, adjustedHighlights);
            highlights := principalMap.put(highlights, caller, updatedUserHighlights);
          };
          case null {};
        };
      };
      case null {};
    };
  };

  // Dynamic Bold Adjustment
  public shared ({ caller }) func adjustBoldRanges(chapterId : Text, editPosition : Nat, editLength : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can adjust bold formatting");
    };

    switch (principalMap.get(boldFormatting, caller)) {
      case (?userBoldFormatting) {
        switch (textMap.get(userBoldFormatting, chapterId)) {
          case (?chapterBoldRanges) {
            let adjustedBoldRanges = Array.map<BoldRange, BoldRange>(
              chapterBoldRanges,
              func(b : BoldRange) : BoldRange {
                if (b.end < editPosition) {
                  b;
                } else if (b.start > editPosition) {
                  {
                    b with
                    start = Nat.add(b.start, editLength);
                    end = Nat.add(b.end, editLength);
                  };
                } else {
                  {
                    b with
                    end = Nat.add(b.end, editLength);
                  };
                };
              },
            );
            let updatedUserBoldFormatting = textMap.put(userBoldFormatting, chapterId, adjustedBoldRanges);
            boldFormatting := principalMap.put(boldFormatting, caller, updatedUserBoldFormatting);
          };
          case null {};
        };
      };
      case null {};
    };
  };
};

