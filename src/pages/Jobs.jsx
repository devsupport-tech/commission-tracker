import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Briefcase, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatsCard } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useContractors, useCommissions, usePartners } from '../hooks/useAirtable';
import { contractorData, autoCreateCommissions } from '../services/airtable';

const statusColors = {
  Active: 'success',
  Closed: 'default',
  'In Progress': 'info',
  Complete: 'success',
  Pending: 'warning',
};

export default function Jobs({ contractorFilter }) {
  const { data: contractorsList, loading: contractorsLoading } = useContractors();
  const { data: existingCommissions, refresh: refreshCommissions } = useCommissions();
  const { data: partnersList } = usePartners();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [synced, setSynced] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const fetchJobs = useCallback(async () => {
    if (!contractorsList || contractorsList.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all jobs from contractor bases
      const allJobs = await contractorData.fetchAllJobs(contractorsList);
      setJobs(allJobs);
      setSynced(true);

      // 2. Auto-create pending commissions for jobs that don't have one
      const { created: newCommissions } = await autoCreateCommissions(allJobs, partnersList);
      if (newCommissions.length > 0) {
        await refreshCommissions();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contractorsList, partnersList, refreshCommissions]);

  // Auto-sync on first load when contractors are available
  useEffect(() => {
    if (contractorsList.length > 0 && !synced && !loading) {
      fetchJobs();
    }
  }, [contractorsList, synced, loading, fetchJobs]);

  const filteredJobs = jobs
    .filter(j => !contractorFilter || j.contractorName === contractorFilter)
    .filter(j => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (j['Claim ID'] || '').toLowerCase().includes(term) ||
        (j['Last Name'] || '').toLowerCase().includes(term) ||
        (j['First Name'] || '').toLowerCase().includes(term) ||
        (j['Address'] || '').toLowerCase().includes(term) ||
        (j.contractorName || '').toLowerCase().includes(term)
      );
    });

  // Stats
  const totalRevenue = filteredJobs.reduce((sum, j) => sum + (j['Total Payout'] || j['RCV'] || 0), 0);
  const jobsWithCommission = new Set(existingCommissions.map(c => c['Job ID']));

  if (contractorsLoading) return <LoadingState message="Loading contractors..." />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">Claims pulled from all contractor bases</p>
        </div>
        <Button icon={RefreshCw} onClick={fetchJobs} disabled={loading}>
          {loading ? 'Syncing...' : 'Sync Jobs'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Jobs"
          value={filteredJobs.length}
          subtitle={`${contractorFilter || 'All contractors'}`}
          icon={Briefcase}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="RCV / Total Payout"
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Pending"
          value={existingCommissions.filter(c => c.Status === 'Pending').length}
          subtitle="Awaiting approval"
          icon={DollarSign}
          variant="warning"
        />
        <StatsCard
          title="Paid"
          value={existingCommissions.filter(c => c.Status === 'Paid').length}
          subtitle="Commissions paid"
          icon={CheckCircle}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by claim ID, name, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {synced && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {contractorFilter
              ? `${filteredJobs.length} of ${jobs.length} jobs (filtered: ${contractorFilter})`
              : `Synced ${jobs.length} jobs`
            }
          </span>
        )}
      </div>

      {/* Error */}
      {error && <ErrorState message={error} onRetry={fetchJobs} />}

      {/* Not synced yet */}
      {!synced && !loading && !error && (
        <Card>
          <CardContent>
            <EmptyState
              icon={Briefcase}
              title="No jobs synced yet"
              description="Click 'Sync Jobs' to pull claims from your contractor bases. Make sure your contractors have valid Base IDs and API keys configured."
            />
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      {synced && (
        <Card>
          <CardHeader>
            <CardTitle icon={Briefcase}>
              Claims ({filteredJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredJobs.length === 0 ? (
              <EmptyState title="No jobs found" description={searchTerm ? 'Try a different search term' : 'No claims returned from contractor bases. Check Base IDs and API keys.'} />
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Adjuster</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-center">Commission Status</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => {
                    const claimId = job['Claim ID'] || job.id;
                    const hasCommission = jobsWithCommission.has(claimId);
                    const customerName = [job['First Name'], job['Last Name']].filter(Boolean).join(' ') || '—';
                    const revenue = job['Total Payout'] || job['RCV'] || 0;
                    const jobStatus = job['Status'] || job['Stage'] || '—';
                    const adjuster = job['Adjuster Name'] || '—';
                    const commission = existingCommissions.find(c => c['Job ID'] === claimId);

                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <span className="font-medium text-purple-600">{claimId}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">{customerName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="purple">{job.contractorName}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">{adjuster}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[jobStatus] || 'default'}>{jobStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {revenue > 0 ? `$${revenue.toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {commission ? (
                            <span className="text-green-600 font-medium">
                              ${commission['Commission Amount']?.toLocaleString() || '—'}
                              <span className="text-xs text-gray-400 ml-1">({commission['Rate Applied']}%)</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {commission ? (
                            <Badge variant={
                              commission.Status === 'Paid' ? 'success' :
                              commission.Status === 'Approved' ? 'info' : 'warning'
                            }>
                              {commission.Status}
                            </Badge>
                          ) : (
                            <Badge variant="default">No Revenue</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
