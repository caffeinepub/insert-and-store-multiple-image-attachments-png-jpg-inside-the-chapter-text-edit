import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import { BooksListPage } from './pages/BooksListPage';
import { BookPage } from './pages/BookPage';
import { ChapterPage } from './pages/ChapterPage';
import { LoginPage } from './pages/LoginPage';
import { useInternetIdentity } from './hooks/useInternetIdentity';

// Root layout component
function RootLayout() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LanguageProvider>
                <div className="h-screen">
                    <Outlet />
                    <Toaster />
                </div>
            </LanguageProvider>
        </ThemeProvider>
    );
}

// Auth wrapper component for protected routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { identity, isInitializing } = useInternetIdentity();

    if (isInitializing) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!identity) {
        return <LoginPage />;
    }

    return <>{children}</>;
}

// Create routes
const rootRoute = createRootRoute({
    component: RootLayout,
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
});

const booksListRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
        <ProtectedRoute>
            <BooksListPage />
        </ProtectedRoute>
    ),
});

const bookRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/book/$bookId',
    component: () => (
        <ProtectedRoute>
            <BookPage />
        </ProtectedRoute>
    ),
});

const chapterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/book/$bookId/chapter/$chapterId',
    component: () => (
        <ProtectedRoute>
            <ChapterPage />
        </ProtectedRoute>
    ),
});

// Build route tree
const routeTree = rootRoute.addChildren([loginRoute, booksListRoute, bookRoute, chapterRoute]);

// Create router
const router = createRouter({ routeTree });

// Register router type
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

// Main App component
export default function App() {
    return <RouterProvider router={router} />;
}
