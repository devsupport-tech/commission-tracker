import { useState } from 'react';
import { Plus, Search, Users, Percent, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatsCard } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Mock data - will be replaced with Airtable data
const mockPartners = [
  {
    id: 1,
    name: 'Partner A',
    role: 'Owner',
    splitPercentage: 60,
    active: true,
  },
  {
    id: 2,
    name: 'Partner B',
    role: 'Partner',
    splitPercentage: 40,
    active: true,
  },
];

const mockSplitHistory = [
  {
    id: 1,
    date: '2024-05-31',
    job: 'CLM-2024-002',
    jobAddress: '123 Main St, Austin, TX',
    netProfit: 8500,
    commissionsDeducted: 850,
    distributableProfit: 7650,
    splits: [
      { partner: 'Partner A', percentage: 60, amount: 4590 },
      { partner: 'Partner B', percentage: 40, amount: 3060 },
    ],
    status: 'distributed',
  },
  {
    id: 2,
    date: '2024-05-28',
    job: 'CLM-2024-001',
    jobAddress: '456 Oak Ave, Dallas, TX',
    netProfit: 15000,
    commissionsDeducted: 1200,
    distributableProfit: 13800,
    splits: [
      { partner: 'Partner A', percentage: 60, amount: 8280 },
      { partner: 'Partner B', percentage: 40, amount: 5520 },
    ],
    status: 'distributed',
  },
  {
    id: 3,
    date: '2024-05-25',
    job: 'CLM-2024-003',
    jobAddress: '789 Pine Rd, Houston, TX',
    netProfit: 5200,
    commissionsDeducted: 500,
    distributableProfit: 4700,
    splits: [
      { partner: 'Partner A', percentage: 60, amount: 2820 },
      { partner: 'Partner B', percentage: 40, amount: 1880 },
    ],
    status: 'pending',
  },
];

const statusColors = {
  pending: 'warning',
  distributed: 'success',
};

export default function CompanySplits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Calculate totals
  const totalDistributed = mockSplitHistory
    .filter(s => s.status === 'distributed')
    .reduce((sum, s) => sum + s.distributableProfit, 0);

  const totalPending = mockSplitHistory
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.distributableProfit, 0);

  const partnerTotals = mockPartners.map(partner => {
    const total = mockSplitHistory
      .filter(s => s.status === 'distributed')
      .reduce((sum, split) => {
        const partnerSplit = split.splits.find(s => s.partner === partner.name);
        return sum + (partnerSplit?.amount || 0);
      }, 0);
    return { ...partner, totalEarned: total };
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Splits</h1>
          <p className="text-gray-500 mt-1">Partner profit distribution after commissions</p>
        </div>
        <Button icon={Plus} onClick={() => setShowPartnerModal(true)}>
          Manage Partners
        </Button>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {partnerTotals.map(partner => (
          <Card key={partner.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{partner.name}</div>
                  <div className="text-sm text-gray-500">{partner.role}</div>
                </div>
              </div>
              <Badge variant="info">{partner.splitPercentage}%</Badge>
            </div>
            <div className="text-2xl font-semibold text-green-600">
              ${partner.totalEarned.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">YTD Distributions</div>
          </Card>
        ))}

        {/* Summary Cards */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Total Distributed</span>
          </div>
          <div className="text-2xl font-semibold text-green-700">
            ${totalDistributed.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Pending Distribution</span>
          </div>
          <div className="text-2xl font-semibold text-orange-700">
            ${totalPending.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Split Calculation Info */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Net Profit</span>
            </div>
            <span className="text-gray-400">−</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Commissions Paid</span>
            </div>
            <span className="text-gray-400">=</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 font-medium">Distributable Profit</span>
            </div>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">Split by Partner %</span>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Split History Table */}
      <Card>
        <CardHeader>
          <CardTitle icon={Percent}>Split History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableHead>Date</TableHead>
              <TableHead>Job</TableHead>
              <TableHead className="text-right">Net Profit</TableHead>
              <TableHead className="text-right">Commissions</TableHead>
              <TableHead className="text-right">Distributable</TableHead>
              <TableHead>Splits</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead></TableHead>
            </TableHeader>
            <TableBody>
              {mockSplitHistory.map((split) => (
                <TableRow key={split.id}>
                  <TableCell className="text-gray-500">{split.date}</TableCell>
                  <TableCell>
                    <div>
                      <span className="text-purple-600 hover:underline cursor-pointer font-medium">
                        {split.job}
                      </span>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {split.jobAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${split.netProfit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    -${split.commissionsDeducted.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${split.distributableProfit.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {split.splits.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{s.partner}:</span>
                          <span className="font-medium">${s.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusColors[split.status]}>
                      {split.status.charAt(0).toUpperCase() + split.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {split.status === 'pending' && (
                      <Button size="sm" variant="success">
                        Distribute
                      </Button>
                    )}
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
