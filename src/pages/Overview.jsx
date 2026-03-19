import { DollarSign, TrendingUp, Receipt, Clock, Wallet, PieChart } from 'lucide-react';
import { StatsCard, Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';

// Mock data - will be replaced with Airtable data
const mockStats = {
  totalRevenue: 255000,
  totalReceived: 147500,
  outstanding: 67500,
  grossProfit: 90500,
  totalCosts: 211200,
  commissionsOwed: 8500,
  commissionsPaid: 12300,
  pendingApproval: 3200,
};

const mockRecentActivity = [
  { id: 1, date: '2024-05-31', type: 'Commission', source: 'Mike Johnson', job: 'CLM-2024-002', amount: 800, status: 'pending' },
  { id: 2, date: '2024-05-30', type: 'Payment', source: 'ABC Contractors', job: 'CLM-2024-001', amount: 1200, status: 'paid' },
  { id: 3, date: '2024-05-28', type: 'Commission', source: 'Sarah Miller', job: 'CLM-2024-003', amount: 650, status: 'approved' },
  { id: 4, date: '2024-05-25', type: 'Payment', source: 'Mike Johnson', job: 'CLM-2024-001', amount: 500, status: 'paid' },
];

const typeColors = {
  Commission: 'purple',
  Payment: 'success',
};

const statusColors = {
  pending: 'warning',
  approved: 'info',
  paid: 'success',
};

export default function Overview() {
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
          <span className="font-semibold text-gray-900">12</span> total jobs
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">
          Commissions Owed: <span className="font-semibold text-orange-500">${mockStats.commissionsOwed.toLocaleString()}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">
          Pending Approval: <span className="font-semibold text-blue-500">${mockStats.pendingApproval.toLocaleString()}</span>
        </span>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`$${mockStats.totalRevenue.toLocaleString()}`}
          subtitle={`ACV: $${(mockStats.totalRevenue * 0.85).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Received"
          value={`$${mockStats.totalReceived.toLocaleString()}`}
          subtitle="All inflows across jobs"
          icon={TrendingUp}
          variant="success"
          trend="up"
        />
        <StatsCard
          title="Outstanding"
          value={`$${mockStats.outstanding.toLocaleString()}`}
          subtitle="Remaining to collect"
          icon={Clock}
          variant="danger"
          trend="down"
        />
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Gross Profit"
          value={`$${mockStats.grossProfit.toLocaleString()}`}
          subtitle={`Margin: ${((mockStats.grossProfit / mockStats.totalRevenue) * 100).toFixed(1)}%`}
          icon={Wallet}
          variant="success"
        />
        <StatsCard
          title="Total Costs"
          value={`$${mockStats.totalCosts.toLocaleString()}`}
          subtitle={`Actual: $${(mockStats.totalCosts * 0.68).toLocaleString()}`}
          icon={Receipt}
        />
        <StatsCard
          title="Commissions Paid"
          value={`$${mockStats.commissionsPaid.toLocaleString()}`}
          subtitle="YTD commission payouts"
          icon={PieChart}
          variant="success"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle icon={Receipt}>Recent Commission Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
              {mockRecentActivity.map((item) => (
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
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${item.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
