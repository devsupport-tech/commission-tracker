/**
 * Airtable Service
 *
 * Handles all interactions with Airtable bases:
 * - Contractor bases (source data, dynamically configured)
 * - Commission Tracker base (our data)
 */

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

const config = {
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || '',
  trackerBaseId: import.meta.env.VITE_TRACKER_BASE_ID || '',
  cbrsBaseId: import.meta.env.VITE_CBRS_BASE_ID || '',
  cbrsApiKey: import.meta.env.VITE_CBRS_API_KEY || '',
  cbrsContractorField: import.meta.env.VITE_CBRS_CONTRACTOR_FIELD || 'Contractor Name',
};

/**
 * Generic Airtable API request
 * @param {string} baseId - The Airtable base ID
 * @param {string} endpoint - Table name + optional query string
 * @param {object} options - fetch options (method, body, headers)
 * @param {string} [apiKey] - Optional API key override (for contractor bases with their own key)
 */
async function airtableRequest(baseId, endpoint, options = {}, apiKey) {
  const key = apiKey || config.apiKey;
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(endpoint.split('?')[0])}${endpoint.includes('?') ? '?' + endpoint.split('?')[1] : ''}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Airtable API error (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch all records from a table (handles pagination)
 * @param {string} baseId
 * @param {string} tableName
 * @param {object} options - view, filterByFormula, sort, fields
 * @param {string} [apiKey] - Optional API key override for this base
 */
async function fetchAllRecords(baseId, tableName, options = {}, apiKey) {
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
    if (options.fields) {
      options.fields.forEach(f => params.append('fields[]', f));
    }

    const queryString = params.toString();
    const endpoint = `${tableName}${queryString ? `?${queryString}` : ''}`;

    const data = await airtableRequest(baseId, endpoint, {}, apiKey);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

/**
 * Helper to build a CRUD service for a tracker base table
 */
function buildCrudService(tableName, defaultSort) {
  return {
    async list(options = {}) {
      const records = await fetchAllRecords(config.trackerBaseId, tableName, {
        sort: defaultSort,
        ...options,
      });
      return records.map(r => ({ id: r.id, ...r.fields }));
    },

    async create(data) {
      const result = await airtableRequest(config.trackerBaseId, tableName, {
        method: 'POST',
        body: JSON.stringify({ fields: data }),
      });
      return { id: result.id, ...result.fields };
    },

    async update(id, data) {
      const result = await airtableRequest(config.trackerBaseId, `${tableName}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: data }),
      });
      return { id: result.id, ...result.fields };
    },

    async delete(id) {
      await airtableRequest(config.trackerBaseId, `${tableName}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}

// ============================================
// COMMISSION TRACKER BASE OPERATIONS
// ============================================

export const contractors = {
  ...buildCrudService('Contractors', [{ field: 'Name', direction: 'asc' }]),
};

export const referralSources = {
  ...buildCrudService('Referral Sources'),
};

export const commissionRules = {
  ...buildCrudService('Commission Rules', [{ field: 'Priority', direction: 'desc' }]),
};

export const commissions = {
  ...buildCrudService('Commissions', [{ field: 'Date Calculated', direction: 'desc' }]),

  async markApproved(id) {
    return this.update(id, {
      Status: 'Approved',
      'Date Approved': new Date().toISOString().split('T')[0],
    });
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
  ...buildCrudService('Partners'),
};

export const companySplits = {
  ...buildCrudService('Company Splits', [{ field: 'Date', direction: 'desc' }]),

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
   * Fetch claims/jobs from all active contractors dynamically.
   * - Standalone contractors: read from their own base
   * - CBRS contractors: read from the shared CBRS base, filtered by contractor name
   */
  async fetchAllJobs(contractorsList) {
    if (!contractorsList || contractorsList.length === 0) return [];

    const activeContractors = contractorsList.filter(c => c.Active !== false);

    // Group CBRS contractors together so we only fetch CBRS once
    const cbrsContractors = activeContractors.filter(c => c['Under CBRS']);
    const standaloneContractors = activeContractors.filter(c => !c['Under CBRS'] && c['Base ID']);

    const allJobs = [];

    // Fetch from standalone contractor bases (each with its own API key)
    const standalonePromises = standaloneContractors.map(async (contractor) => {
      const tableName = contractor['Claims Table'] || 'Claims';
      const contractorApiKey = contractor['API Key'] || undefined;
      try {
        const records = await fetchAllRecords(contractor['Base ID'], tableName, {}, contractorApiKey);
        return records.map(r => ({
          id: r.id,
          contractorName: contractor.Name,
          contractorId: contractor.id,
          sourceBaseId: contractor['Base ID'],
          ...r.fields,
        }));
      } catch (error) {
        console.error(`Failed to fetch from ${contractor.Name}:`, error);
        return [];
      }
    });

    // Fetch from CBRS base once (if any CBRS contractors exist)
    // Uses CBRS-specific API key, falling back to global key
    let cbrsPromise = Promise.resolve([]);
    if (cbrsContractors.length > 0 && config.cbrsBaseId) {
      const cbrsKey = config.cbrsApiKey || undefined;
      cbrsPromise = (async () => {
        try {
          const records = await fetchAllRecords(config.cbrsBaseId, 'Claims', {}, cbrsKey);
          const cbrsNames = new Set(cbrsContractors.map(c => c.Name));
          const fieldName = config.cbrsContractorField;

          return records
            .filter(r => cbrsNames.has(r.fields[fieldName]))
            .map(r => ({
              id: r.id,
              contractorName: r.fields[fieldName],
              contractorId: cbrsContractors.find(c => c.Name === r.fields[fieldName])?.id,
              sourceBaseId: config.cbrsBaseId,
              ...r.fields,
            }));
        } catch (error) {
          console.error('Failed to fetch from CBRS base:', error);
          return [];
        }
      })();
    }

    const results = await Promise.all([...standalonePromises, cbrsPromise]);
    results.forEach(jobs => allJobs.push(...jobs));

    return allJobs;
  },

  /**
   * Fetch modules for a specific job
   * @param {string} apiKey - Optional API key for this base
   */
  async fetchJobModules(baseId, claimId, apiKey) {
    const records = await fetchAllRecords(baseId, 'Modules', {
      filterByFormula: `{Claim} = "${claimId}"`,
    }, apiKey);
    return records.map(r => ({ id: r.id, ...r.fields }));
  },

  /**
   * Fetch costs/payments for a specific job
   * @param {string} apiKey - Optional API key for this base
   */
  async fetchJobCosts(baseId, claimId, apiKey) {
    const records = await fetchAllRecords(baseId, 'Payments Log', {
      filterByFormula: `{Claim} = "${claimId}"`,
    }, apiKey);
    return records.map(r => ({ id: r.id, ...r.fields }));
  },
};

// ============================================
// COMMISSION CALCULATION
// ============================================

// Default commission rate when no referral source rate is set
const DEFAULT_COMMISSION_RATE = 10; // 10%

/**
 * Calculate commission for a job based on its adjuster's referral source settings.
 * 1. Find adjuster name from job's "Adjuster Name" field
 * 2. Look for matching referral source
 * 3. Use that source's Default Comm Type / Default Comm Rate
 * 4. If no source found or no rate set, use default 10% of revenue
 */
export function autoCalculateCommission(job, sources) {
  const adjusterName = job['Adjuster Name'] || '';
  const revenue = job['Total Payout'] || job['RCV'] || 0;

  // Find matching referral source for this adjuster
  const source = adjusterName
    ? sources.find(s => s.Name === adjusterName && s.Active !== false)
    : null;

  // Get commission settings from the referral source
  const commType = source?.['Default Comm Type'] || '% of Revenue';
  const commRate = source?.['Default Comm Rate'] || DEFAULT_COMMISSION_RATE;
  const flatAmount = source?.['Default Flat Amount'] || 0;

  // Flat Rate
  if (commType === 'Flat Rate') {
    return {
      amount: flatAmount || commRate || 0,
      basis: 'Flat Rate',
      basisAmount: 0,
      rate: flatAmount || commRate || 0,
      rateType: 'Flat',
      source,
      adjusterName,
      isDefault: !source,
    };
  }

  // % of Profit
  if (commType === '% of Profit') {
    const costs = job.totalCosts || 0;
    const basisAmount = revenue - costs;
    const amount = basisAmount * (commRate / 100);
    return {
      amount,
      basis: '% of Profit',
      basisAmount,
      rate: commRate,
      rateType: 'Percentage',
      source,
      adjusterName,
      isDefault: !source,
    };
  }

  // % of Revenue (default)
  const basisAmount = revenue;
  const amount = basisAmount * (commRate / 100);
  return {
    amount,
    basis: '% of Revenue',
    basisAmount,
    rate: commRate,
    rateType: 'Percentage',
    source,
    adjusterName,
    isDefault: !source,
  };
}

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

  return { netProfit, commissionAmount, distributableProfit, splits };
}

/**
 * Sync adjuster names from jobs into the Referral Sources table.
 * Creates new referral sources for any adjusters not already in the table.
 * Pulls email/phone from the claim if available.
 */
export async function syncAdjustersToReferralSources(jobs) {
  // Get existing referral sources
  const existing = await referralSources.list();
  const existingNames = new Set(existing.map(s => s.Name));

  // Collect unique adjusters from jobs with their contact info
  const adjusterMap = new Map();
  for (const job of jobs) {
    const name = job['Adjuster Name'];
    if (!name || existingNames.has(name) || adjusterMap.has(name)) continue;
    adjusterMap.set(name, {
      Name: name,
      Type: 'Adjuster',
      Email: job['Adjuster Email'] || '',
      Phone: job['Adjuster Phone'] || '',
      'Default Comm Type': '% of Revenue',
      'Default Comm Rate': 10,
      Active: true,
      Notes: `Auto-synced from ${job.contractorName || 'claims'}`,
    });
  }

  // Create missing referral sources
  const created = [];
  for (const fields of adjusterMap.values()) {
    try {
      const record = await referralSources.create(fields);
      created.push(record);
    } catch (err) {
      console.error(`Failed to create referral source for ${fields.Name}:`, err);
    }
  }

  return { created, total: existing.length + created.length };
}

/**
 * Auto-create pending commissions for all jobs that don't already have one.
 * Uses the adjuster's referral source rate (or default 10%).
 * Also creates company split records for each active partner.
 */
export async function autoCreateCommissions(jobs, sourcesList, partnersList) {
  // Get existing commissions to avoid duplicates
  const existing = await commissions.list();
  const existingJobIds = new Set(existing.map(c => c['Job ID']));

  const created = [];
  for (const job of jobs) {
    const claimId = job['Claim ID'] || job.id;
    if (existingJobIds.has(claimId)) continue;

    const calc = autoCalculateCommission(job, sourcesList);

    try {
      // Create commission record
      await commissions.create({
        'Job ID': claimId,
        'Job Source Base': job.contractorName,
        'Contractor Name': job.contractorName,
        'Adjuster Name': job['Adjuster Name'] || '',
        'Referral Source Name': calc.source?.Name || calc.adjusterName || '',
        'Commission Basis': calc.basis || '% of Revenue',
        'Basis Amount': calc.basisAmount || 0,
        'Rate Applied': calc.rate || 0,
        'Commission Amount': calc.amount || 0,
        'Status': 'Pending',
        'Date Calculated': new Date().toISOString().split('T')[0],
      });

      // Create company split records
      if (partnersList && partnersList.length > 0) {
        const splits = calculateCompanySplits(job, calc.amount, partnersList);
        for (const split of splits.splits) {
          await companySplits.create({
            'Job ID': claimId,
            'Date': new Date().toISOString().split('T')[0],
            'Net Profit': splits.netProfit,
            'Commission Deducted': calc.amount,
            'Distributable Profit': splits.distributableProfit,
            'Partner Name': split.partnerName,
            'Partner Percentage': split.percentage,
            'Split Amount': split.amount,
            'Status': 'Pending',
          });
        }
      }

      created.push(claimId);
    } catch (err) {
      console.error(`Failed to create commission for ${claimId}:`, err);
    }
  }

  return { created, skipped: existingJobIds.size };
}

/**
 * Check if Airtable is configured
 */
export function isConfigured() {
  return !!(config.apiKey && config.trackerBaseId);
}

export default {
  contractors,
  referralSources,
  commissionRules,
  commissions,
  partners,
  companySplits,
  contractorData,
  autoCalculateCommission,
  calculateCompanySplits,
  syncAdjustersToReferralSources,
  autoCreateCommissions,
  isConfigured,
};
