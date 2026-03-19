/**
 * Airtable Service
 *
 * Handles all interactions with Airtable bases:
 * - Contractor bases (source data)
 * - Commission Tracker base (our data)
 */

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

// Configuration - will be loaded from environment variables
const config = {
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || '',

  // Commission Tracker base (our new base)
  trackerBaseId: import.meta.env.VITE_TRACKER_BASE_ID || '',

  // Contractor bases (source data)
  contractorBases: [
    {
      id: import.meta.env.VITE_CONTRACTOR_BASE_1 || '',
      name: 'Main Contractor',
    },
    // Add more contractor bases as needed
  ],
};

/**
 * Generic Airtable API request
 */
async function airtableRequest(baseId, endpoint, options = {}) {
  const url = `${AIRTABLE_API_URL}/${baseId}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Airtable API error');
  }

  return response.json();
}

/**
 * Fetch all records from a table
 */
async function fetchAllRecords(baseId, tableName, options = {}) {
  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);
    if (options.view) params.set('view', options.view);
    if (options.filterByFormula) params.set('filterByFormula', options.filterByFormula);
    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction || 'asc');
      });
    }

    const queryString = params.toString();
    const endpoint = `${tableName}${queryString ? `?${queryString}` : ''}`;

    const data = await airtableRequest(baseId, endpoint);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// ============================================
// COMMISSION TRACKER BASE OPERATIONS
// ============================================

export const referralSources = {
  async list() {
    const records = await fetchAllRecords(config.trackerBaseId, 'Referral Sources');
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  async create(data) {
    const result = await airtableRequest(config.trackerBaseId, 'Referral Sources', {
      method: 'POST',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async update(id, data) {
    const result = await airtableRequest(config.trackerBaseId, `Referral Sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async delete(id) {
    await airtableRequest(config.trackerBaseId, `Referral Sources/${id}`, {
      method: 'DELETE',
    });
  },
};

export const commissionRules = {
  async list() {
    const records = await fetchAllRecords(config.trackerBaseId, 'Commission Rules', {
      sort: [{ field: 'Priority', direction: 'desc' }],
    });
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  async create(data) {
    const result = await airtableRequest(config.trackerBaseId, 'Commission Rules', {
      method: 'POST',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async update(id, data) {
    const result = await airtableRequest(config.trackerBaseId, `Commission Rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async delete(id) {
    await airtableRequest(config.trackerBaseId, `Commission Rules/${id}`, {
      method: 'DELETE',
    });
  },
};

export const commissions = {
  async list(options = {}) {
    const records = await fetchAllRecords(config.trackerBaseId, 'Commissions', {
      sort: [{ field: 'Date Calculated', direction: 'desc' }],
      ...options,
    });
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  async create(data) {
    const result = await airtableRequest(config.trackerBaseId, 'Commissions', {
      method: 'POST',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async update(id, data) {
    const result = await airtableRequest(config.trackerBaseId, `Commissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async markPaid(id, paymentInfo) {
    return this.update(id, {
      Status: 'Paid',
      'Date Paid': paymentInfo.date || new Date().toISOString().split('T')[0],
      'Payment Method': paymentInfo.method,
      'Payment Reference': paymentInfo.reference,
    });
  },
};

export const partners = {
  async list() {
    const records = await fetchAllRecords(config.trackerBaseId, 'Partners');
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  async create(data) {
    const result = await airtableRequest(config.trackerBaseId, 'Partners', {
      method: 'POST',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async update(id, data) {
    const result = await airtableRequest(config.trackerBaseId, `Partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async delete(id) {
    await airtableRequest(config.trackerBaseId, `Partners/${id}`, {
      method: 'DELETE',
    });
  },
};

export const companySplits = {
  async list(options = {}) {
    const records = await fetchAllRecords(config.trackerBaseId, 'Company Splits', {
      sort: [{ field: 'Date', direction: 'desc' }],
      ...options,
    });
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  async create(data) {
    const result = await airtableRequest(config.trackerBaseId, 'Company Splits', {
      method: 'POST',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async update(id, data) {
    const result = await airtableRequest(config.trackerBaseId, `Company Splits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: data }),
    });
    return { id: result.id, ...result.fields };
  },

  async markDistributed(id) {
    return this.update(id, {
      Status: 'Distributed',
      'Date Distributed': new Date().toISOString().split('T')[0],
    });
  },
};

// ============================================
// CONTRACTOR BASE OPERATIONS (Read-only)
// ============================================

export const contractorData = {
  /**
   * Fetch claims/jobs from all contractor bases
   */
  async fetchAllJobs() {
    const allJobs = [];

    for (const base of config.contractorBases) {
      if (!base.id) continue;

      try {
        const records = await fetchAllRecords(base.id, 'Claims');
        const jobs = records.map(r => ({
          id: r.id,
          sourceBase: base.name,
          sourceBaseId: base.id,
          ...r.fields,
        }));
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Failed to fetch from ${base.name}:`, error);
      }
    }

    return allJobs;
  },

  /**
   * Fetch modules for a specific job
   */
  async fetchJobModules(baseId, claimId) {
    const records = await fetchAllRecords(baseId, 'Modules', {
      filterByFormula: `{Claim} = "${claimId}"`,
    });
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  /**
   * Fetch costs/payments for a specific job
   */
  async fetchJobCosts(baseId, claimId) {
    const records = await fetchAllRecords(baseId, 'Payments Log', {
      filterByFormula: `{Claim} = "${claimId}"`,
    });
    return records.map(r => ({ id: r.id, ...r.fields }));
  },
};

// ============================================
// COMMISSION CALCULATION
// ============================================

/**
 * Find the matching commission rule for a job
 */
export function findMatchingRule(rules, job, referralSource) {
  // Sort rules by priority (highest first)
  const sortedRules = [...rules].sort((a, b) => (b.Priority || 0) - (a.Priority || 0));

  for (const rule of sortedRules) {
    // Skip inactive rules
    if (!rule.Active) continue;

    // Check if rule matches specific source
    if (rule['Specific Source'] && rule['Specific Source'] !== referralSource?.Name) {
      continue;
    }

    // Check if rule matches source type
    if (rule['Source Type'] && rule['Source Type'] !== referralSource?.Type) {
      continue;
    }

    // Check if rule matches job type
    if (rule['Job Type'] && rule['Job Type'] !== 'All') {
      // Get job types from modules
      const jobTypes = job.modules?.map(m => m['Module Type']) || [];
      if (!jobTypes.includes(rule['Job Type'])) {
        continue;
      }
    }

    // Rule matches!
    return rule;
  }

  return null;
}

/**
 * Calculate commission amount based on rule
 */
export function calculateCommission(rule, job) {
  if (!rule) return { amount: 0, basis: null, basisAmount: 0 };

  let basisAmount = 0;
  const basis = rule['Commission Basis'];

  switch (basis) {
    case 'Revenue Collected':
      basisAmount = job['Total Payout'] || 0;
      break;
    case 'Net Profit':
      const revenue = job['Total Payout'] || 0;
      const costs = job.totalCosts || 0;
      basisAmount = revenue - costs;
      break;
    case 'Flat Rate':
      return {
        amount: rule['Rate Value'] || 0,
        basis: 'Flat Rate',
        basisAmount: 0,
        rate: rule['Rate Value'],
        rateType: 'Flat',
      };
    default:
      basisAmount = 0;
  }

  // Check minimum threshold
  if (rule['Min Threshold'] && basisAmount < rule['Min Threshold']) {
    return { amount: 0, basis, basisAmount, disqualified: 'Below minimum threshold' };
  }

  // Calculate commission
  const rate = rule['Rate Value'] || 0;
  let amount = basisAmount * (rate / 100);

  // Apply maximum cap
  if (rule['Max Commission'] && amount > rule['Max Commission']) {
    amount = rule['Max Commission'];
  }

  return {
    amount,
    basis,
    basisAmount,
    rate,
    rateType: 'Percentage',
  };
}

/**
 * Calculate company splits for a job after commissions
 */
export function calculateCompanySplits(job, commissionAmount, partnersList) {
  const netProfit = (job['Total Payout'] || 0) - (job.totalCosts || 0);
  const distributableProfit = netProfit - commissionAmount;

  const splits = partnersList
    .filter(p => p.Active)
    .map(partner => ({
      partnerId: partner.id,
      partnerName: partner.Name,
      percentage: partner['Split Percentage'] || 0,
      amount: distributableProfit * ((partner['Split Percentage'] || 0) / 100),
    }));

  return {
    netProfit,
    commissionAmount,
    distributableProfit,
    splits,
  };
}

export default {
  referralSources,
  commissionRules,
  commissions,
  partners,
  companySplits,
  contractorData,
  findMatchingRule,
  calculateCommission,
  calculateCompanySplits,
};
