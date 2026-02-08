# Specification

## Summary
**Goal:** Restore the “Add book” flow on the Books List page after login by fixing button responsiveness, actor initialization handling, access control initialization, and missing UI translations.

**Planned changes:**
- Ensure the Books List “Add book” button always opens the create-book dialog even while the backend actor is still initializing.
- Block the dialog’s final “Create” action until the backend actor is ready; if not ready, show a clear actionable toast/error and do not call `createBook`.
- Add actor initialization status UI near the “Add book” button (small loading indicator while fetching/initializing).
- If actor initialization fails (no actor after fetch completes), show an inline error banner with a “Retry” action that triggers a React Query invalidation/refetch of the actor query.
- Update `backend/main.mo` so `initializeAccessControl` is safe to call repeatedly and ensures newly authenticated users receive required “user” permissions for book CRUD APIs.
- Fix missing translations so raw keys (e.g., `books.new`) are not displayed; add the specified keys with English and Polish values in the LanguageContext translations map.

**User-visible outcome:** On the books list, the “Add book” button shows a proper translated label and always opens the create dialog; users see clear backend initialization/loading or retry states, and creating a book only works once the backend is ready (with a helpful error message otherwise).
