import { useState } from 'react';
import Sidebar from './Sidebar';
import { useContractors, useCommissions, useJobs } from '../../hooks/useAirtable';
import { contractorData } from '../../services/airtable';

export default function Layout({ children }) {
  const [syncing, setSyncing] = useState(false);
  const [contractorFilter, setContractorFilter] = useState('');
  const { data: contractorsList } = useContractors();
  const { data: commissionsList } = useCommissions();

  const pendingCommissions = commissionsList
    .filter(c => c.Status === 'Pending')
    .map(c => ({
      id: c.id,
      jobName: c['Job ID'] || 'Unknown Job',
      amount: c['Commission Amount'] || 0,
    }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const jobs = await contractorData.fetchAllJobs(contractorsList);
      console.log(`Synced ${jobs.length} jobs from ${contractorsList.length} contractors`);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        pendingCommissions={pendingCommissions}
        onSync={handleSync}
        syncing={syncing}
        contractors={contractorsList}
        contractorFilter={contractorFilter}
        onContractorFilterChange={setContractorFilter}
      />
      <main className="flex-1 overflow-auto">
        {typeof children === 'function' ? children(contractorFilter, setContractorFilter) : children}
      </main>
    </div>
  );
}
