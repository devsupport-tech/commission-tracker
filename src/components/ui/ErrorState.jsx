import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertTriangle className="w-8 h-8 text-orange-500 mb-3" />
      <p className="text-gray-700 font-medium mb-1">Something went wrong</p>
      <p className="text-gray-500 text-sm mb-4 max-w-md text-center">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
