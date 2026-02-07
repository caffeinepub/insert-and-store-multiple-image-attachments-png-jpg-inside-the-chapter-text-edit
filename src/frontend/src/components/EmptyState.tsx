import { FileText } from 'lucide-react';

interface EmptyStateProps {
    message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-3">
                <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-6">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                </div>
                <p className="text-lg text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}
