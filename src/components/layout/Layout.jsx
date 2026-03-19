import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [syncing, setSyncing] = useState(false);
  const [pendingCommissions, setPendingCommissions] = useState([]);

  const handleSync = async () => {
    setSyncing(true);
    // TODO: Implement actual sync logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        pendingCommissions={pendingCommissions}
        onSync={handleSync}
        syncing={syncing}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
