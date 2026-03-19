import { useState } from 'react';
import { Plus, Search, MoreVertical, User, Building, Phone, Mail } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Mock data - will be replaced with Airtable data
const mockSources = [
  {
    id: 1,
    name: 'Mike Johnson',
    company: 'State Farm Insurance',
    type: 'Adjuster',
    email: 'mike.johnson@statefarm.com',
    phone: '(555) 123-4567',
    defaultCommType: '% of Revenue',
    defaultRate: 10,
    totalJobs: 8,
    totalCommissions: 4500,
    active: true,
  },
  {
    id: 2,
    name: 'ABC Contractors',
    company: 'ABC Contractors LLC',
    type: 'Contractor',
    email: 'referrals@abccontractors.com',
    phone: '(555) 234-5678',
    defaultCommType: '% of Profit',
    defaultRate: 8,
    totalJobs: 5,
    totalCommissions: 3200,
    active: true,
  },
  {
    id: 3,
    name: 'Sarah Miller',
    company: 'Premier Realty',
    type: 'Realtor',
    email: 'sarah@premierrealty.com',
    phone: '(555) 345-6789',
    defaultCommType: 'Flat Rate',
    defaultRate: 500,
    totalJobs: 3,
    totalCommissions: 1500,
    active: true,
  },
  {
    id: 4,
    name: 'John Davis',
    company: 'Allstate Insurance',
    type: 'Adjuster',
    email: 'john.davis@allstate.com',
    phone: '(555) 456-7890',
    defaultCommType: '% of Revenue',
    defaultRate: 12,
    totalJobs: 2,
    totalCommissions: 1800,
    active: false,
  },
];

const typeColors = {
  Adjuster: 'info',
  Contractor: 'purple',
  Realtor: 'success',
  'Property Manager': 'warning',
  'Past Client': 'default',
};

export default function ReferralSources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredSources = mockSources.filter(
    source =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Sources</h1>
          <p className="text-gray-500 mt-1">Manage who sends you work and their commission rates</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Source
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Default Commission</TableHead>
              <TableHead className="text-center">Jobs</TableHead>
              <TableHead className="text-right">Total Earned</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead></TableHead>
            </TableHeader>
            <TableBody>
              {filteredSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {source.type === 'Contractor' ? (
                          <Building className="w-5 h-5 text-purple-600" />
                        ) : (
                          <User className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{source.name}</div>
                        <div className="text-sm text-gray-500">{source.company}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeColors[source.type]}>{source.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {source.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {source.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {source.defaultCommType === 'Flat Rate'
                        ? `$${source.defaultRate}`
                        : `${source.defaultRate}%`}
                    </div>
                    <div className="text-sm text-gray-500">{source.defaultCommType}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-gray-900">{source.totalJobs}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">
                      ${source.totalCommissions.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={source.active ? 'success' : 'default'}>
                      {source.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
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
