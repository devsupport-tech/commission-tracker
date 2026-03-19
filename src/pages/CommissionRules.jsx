import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Mock data - will be replaced with Airtable data
const mockRules = [
  {
    id: 1,
    name: 'Adjuster - Mitigation 10%',
    sourceType: 'Adjuster',
    specificSource: null,
    jobType: 'Mitigation',
    commissionBasis: 'Revenue Collected',
    rateType: 'Percentage',
    rateValue: 10,
    minThreshold: 0,
    maxCommission: null,
    priority: 10,
    active: true,
  },
  {
    id: 2,
    name: 'Adjuster - Rebuild 8%',
    sourceType: 'Adjuster',
    specificSource: null,
    jobType: 'Rebuild',
    commissionBasis: 'Net Profit',
    rateType: 'Percentage',
    rateValue: 8,
    minThreshold: 5000,
    maxCommission: 5000,
    priority: 10,
    active: true,
  },
  {
    id: 3,
    name: 'Contractor Referrals',
    sourceType: 'Contractor',
    specificSource: null,
    jobType: 'All',
    commissionBasis: 'Net Profit',
    rateType: 'Percentage',
    rateValue: 5,
    minThreshold: 0,
    maxCommission: null,
    priority: 5,
    active: true,
  },
  {
    id: 4,
    name: 'Realtor Flat Fee',
    sourceType: 'Realtor',
    specificSource: null,
    jobType: 'All',
    commissionBasis: 'Flat Rate',
    rateType: 'Flat',
    rateValue: 500,
    minThreshold: 2500,
    maxCommission: null,
    priority: 5,
    active: true,
  },
  {
    id: 5,
    name: 'Mike Johnson Special',
    sourceType: 'Adjuster',
    specificSource: 'Mike Johnson',
    jobType: 'All',
    commissionBasis: 'Revenue Collected',
    rateType: 'Percentage',
    rateValue: 12,
    minThreshold: 0,
    maxCommission: null,
    priority: 20,
    active: true,
  },
];

const basisColors = {
  'Revenue Collected': 'info',
  'Net Profit': 'success',
  'Flat Rate': 'purple',
};

const jobTypeColors = {
  'Mitigation': 'warning',
  'Rebuild': 'info',
  'Packout': 'purple',
  'Estimate': 'default',
  'All': 'success',
};

export default function CommissionRules() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Rules</h1>
          <p className="text-gray-500 mt-1">Configure how commissions are calculated by source and job type</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Rule
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">How rules are matched:</p>
          <p className="mt-1">
            Rules are evaluated by priority (highest first). Specific source rules override general source type rules.
            The first matching rule is applied.
          </p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableHead>Rule Name</TableHead>
              <TableHead>Source Type</TableHead>
              <TableHead>Job Type</TableHead>
              <TableHead>Commission Basis</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Thresholds</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead></TableHead>
            </TableHeader>
            <TableBody>
              {mockRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{rule.name}</div>
                      {rule.specificSource && (
                        <div className="text-sm text-purple-600">
                          Specific: {rule.specificSource}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{rule.sourceType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={jobTypeColors[rule.jobType]}>{rule.jobType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={basisColors[rule.commissionBasis]}>
                      {rule.commissionBasis}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      {rule.rateType === 'Flat' ? `$${rule.rateValue}` : `${rule.rateValue}%`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {rule.minThreshold > 0 && (
                        <div className="text-gray-600">
                          Min: ${rule.minThreshold.toLocaleString()}
                        </div>
                      )}
                      {rule.maxCommission && (
                        <div className="text-gray-600">
                          Max: ${rule.maxCommission.toLocaleString()}
                        </div>
                      )}
                      {rule.minThreshold === 0 && !rule.maxCommission && (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      {rule.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={rule.active ? 'success' : 'default'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
