import { DollarSign, TrendingUp, Receipt, Clock, Wallet, PieChart } from 'lucide-react';
import { StatsCard, Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useCommissions, useJobs, useContractors, usePartners } from '../hooks/useAirtable';

const typeColors = {
  Commission: 'purple',
  Payment: 'success',
};

const statusColors = {
  Pending: 'warning',
  Approved: 'info',
  Paid: 'success',
  Disputed: 'danger',
};

export default function Overview({ contractorFilter }) {
  const { data: contractorsList } = useContractors();
  const { data: commissionsList, loading, error, refresh } = useCommissions();
  const { jobs } = useJobs(contractorsList, contractorFilter);
  const { data: partnersList } = usePartners();

  const filteredCommissions = contractorFilter
    ? commissionsList.filter(c => c['Contractor Name'] === contractorFilter)
    : commissionsList;

  // Calculate stats from live data
  const totalRevenue = jobs.reduce((sum, j) => sum + (j['Total Payout'] || 0), 0);
  const totalCosts = jobs.reduce((sum, j) => sum + (j.totalCosts || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const commissionsOwed = filteredCommissions
    .filter(c => c.Status === 'Pending' || c.Status === 'Approved')
    .reduce((sum, c) => sum + (c['Commission Amount'] || 0), 0);
  const commissionsPaid = filteredCommissions
    .filter(c => c.Status === 'Paid')
    .reduce((sum, c) => sum + (c['Commission Amount'] || 0), 0);
  const pendingApproval = filteredCommissions
    .filter(c => c.Status === 'Pending')
    .reduce((sum, c) => sum + (c['Commission Amount'] || 0), 0);

  // Recent activity from commissions
  const recentActivity = filteredCommissions.slice(0, 10).map(c => ({
    id: c.id,
    date: c['Date Calculated'] || c['Date Paid'] || '',
    type: c.Status === 'Paid' ? 'Payment' : 'Commission',
    source: c['Referral Source Name'] || c['Referral Source'] || '—',
    job: c['Job ID'] || '—',
    amount: c['Commission Amount'] || 0,
    status: c.Status || 'Pending',
  }));

  if (loading) return <LoadingState message="Loading overview..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Commission Overview</h1>
        <p className="text-gray-500 mt-1">Track referral commissions & profit splits</p>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-8 text-sm">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{jobs.length}</span> total jobs
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">
          Commissions Owed: <span className="font-semibold text-orange-500">${commissionsOwed.toLocaleString()}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">
          Pending Approval: <span className="font-semibold text-blue-500">${pendingApproval.toLocaleString()}</span>
        </span>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`${jobs.length} jobs`}
          icon={DollarSign}
        />
        <StatsCard
          title="Gross Profit"
          value={`$${grossProfit.toLocaleString()}`}
          subtitle={totalRevenue > 0 ? `Margin: ${((grossProfit / totalRevenue) * 100).toFixed(1)}%` : '—'}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Total Costs"
          value={`$${totalCosts.toLocaleString()}`}
          subtitle="Across all jobs"
          icon={Clock}
        />
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Commissions Owed"
          value={`$${commissionsOwed.toLocaleString()}`}
          subtitle="Pending + Approved"
          icon={Wallet}
          variant="warning"
        />
        <StatsCard
          title="Commissions Paid"
          value={`$${commissionsPaid.toLocaleString()}`}
          subtitle="YTD commission payouts"
          icon={Receipt}
          variant="success"
        />
        <StatsCard
          title="Partners"
          value={partnersList.filter(p => p.Active).length}
          subtitle="Active partners"
          icon={PieChart}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle icon={Receipt}>Recent Commission Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <EmptyState title="No commission activity yet" description="Commissions will appear here once jobs are processed" />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Referral Source</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableHeader>
              <TableBody>
                {recentActivity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Badge variant={typeColors[item.type]}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{item.source}</TableCell>
                    <TableCell>
                      <span className="text-purple-600 hover:underline cursor-pointer">
                        {item.job}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[item.status]}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${item.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
