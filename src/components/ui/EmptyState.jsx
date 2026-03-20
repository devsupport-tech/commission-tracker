import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data yet', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-gray-600 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
