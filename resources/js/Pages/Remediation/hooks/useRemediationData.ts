import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type RemediationAction = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    title: string;
    action_type: string;
    status: string;
    finding_title: string | null;
    initiated_by: string | null;
    completed_at: string | null;
};

export type RemediationSummary = {
    total_actions: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
};

export type RemediationData = {
    summary: RemediationSummary;
    actions: RemediationAction[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export function useRemediationData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<RemediationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage) => {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);

            fetch(`/api/v1/remediation?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load remediation data');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load remediation data');
                })
                .finally(() => setLoading(false));
        },
        [page, perPage, selectedTenantId],
    );

    useEffect(() => {
        fetchData();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, error, page, perPage, setPage, setPerPage, fetchData };
}
