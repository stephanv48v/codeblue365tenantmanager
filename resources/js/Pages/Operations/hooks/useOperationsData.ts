import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

type SyncRun = {
    id: number;
    tenant_id: string;
    sync_job: string;
    status: string;
    records_processed: number;
    started_at: string;
    finished_at: string | null;
};

type SyncSummary = { completed: number; failed: number; pending: number; total: number };
type StaleTenant = { tenant_id: string; customer_name: string; last_sync_at: string | null };
type TrendPoint = { date: string; success: number; failed: number; partial: number; total: number };

export type OperationsData = {
    syncRuns: SyncRun[];
    summary: SyncSummary;
    staleTenants: StaleTenant[];
    openAlerts: number;
    trends: TrendPoint[];
};

export function useOperationsData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<OperationsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [opsRes, trendsRes] = await Promise.all([
                fetch(buildUrl('/api/v1/dashboard/operations')).then((r) => r.json()),
                fetch(buildUrl('/api/v1/sync/trends')).then((r) => r.json()),
            ]);

            setData({
                syncRuns: opsRes.success ? (opsRes.data.recent_sync_runs ?? []) : [],
                summary: opsRes.success
                    ? (opsRes.data.sync_summary ?? { completed: 0, failed: 0, pending: 0, total: 0 })
                    : { completed: 0, failed: 0, pending: 0, total: 0 },
                staleTenants: opsRes.success ? (opsRes.data.stale_tenants ?? []) : [],
                openAlerts: opsRes.success ? (opsRes.data.open_alerts ?? 0) : 0,
                trends: trendsRes.success ? (trendsRes.data.items ?? []) : [],
            });
        } catch {
            setError('Failed to load operations data.');
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId, buildUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
