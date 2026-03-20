import { useState, useEffect, useCallback } from 'react';
import {
  contractors as contractorsApi,
  referralSources as referralSourcesApi,
  commissionRules as commissionRulesApi,
  commissions as commissionsApi,
  partners as partnersApi,
  companySplits as companySplitsApi,
  contractorData,
  isConfigured,
} from '../services/airtable';

/**
 * Generic hook for Airtable CRUD tables
 */
function useAirtableTable(api, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false);
      setError('Airtable not configured. Set VITE_AIRTABLE_API_KEY and VITE_TRACKER_BASE_ID in .env');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await api.list();
      setData(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (fields) => {
    const record = await api.create(fields);
    setData(prev => [...prev, record]);
    return record;
  };

  const update = async (id, fields) => {
    const record = await api.update(id, fields);
    setData(prev => prev.map(r => (r.id === id ? record : r)));
    return record;
  };

  const remove = async (id) => {
    await api.delete(id);
    setData(prev => prev.filter(r => r.id !== id));
  };

  return { data, loading, error, refresh, create, update, remove };
}

export function useContractors() {
  return useAirtableTable(contractorsApi);
}

export function useReferralSources() {
  return useAirtableTable(referralSourcesApi);
}

export function useCommissionRules() {
  return useAirtableTable(commissionRulesApi);
}

export function useCommissions() {
  const hook = useAirtableTable(commissionsApi);

  const markApproved = async (id) => {
    const record = await commissionsApi.markApproved(id);
    hook.refresh();
    return record;
  };

  const markPaid = async (id, paymentInfo) => {
    const record = await commissionsApi.markPaid(id, paymentInfo);
    hook.refresh();
    return record;
  };

  return { ...hook, markApproved, markPaid };
}

export function usePartners() {
  return useAirtableTable(partnersApi);
}

export function useCompanySplits() {
  const hook = useAirtableTable(companySplitsApi);

  const markDistributed = async (id) => {
    const record = await companySplitsApi.markDistributed(id);
    hook.refresh();
    return record;
  };

  return { ...hook, markDistributed };
}

/**
 * Fetch jobs from all contractor bases
 */
export function useJobs(contractorsList, contractorFilter) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!contractorsList || contractorsList.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allJobs = await contractorData.fetchAllJobs(contractorsList);
      setJobs(allJobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contractorsList]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredJobs = contractorFilter
    ? jobs.filter(j => j.contractorName === contractorFilter)
    : jobs;

  return { jobs: filteredJobs, allJobs: jobs, loading, error, refresh };
}
