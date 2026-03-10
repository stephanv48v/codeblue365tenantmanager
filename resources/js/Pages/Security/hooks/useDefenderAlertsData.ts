import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type DefenderAlert = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    title: string;
    severity: string;
    category: string;
    status: string;
    service_source: string;
    assigned_to: string | null;
    first_activity_date: string;
};

export type DefenderAlertsSummary = {
    total_alerts: number;
    high_severity: number;
    in_progress: number;
    resolved: number;
};

export type DefenderAlertsData = {
    summary: DefenderAlertsSummary;
    alerts: DefenderAlert[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type DefenderFilters = {
    severity: string;
    status: string;
};

export function useDefenderAlertsData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<DefenderAlertsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<DefenderFilters>({ severity: '', status: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.severity) params.set('severity', f.severity);
            if (f.status) params.set('status', f.status);

            fetch(`/api/v1/security/defender-alerts?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load Defender alerts');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load Defender alerts');
                })
                .finally(() => setLoading(false));
        },
        [page, perPage, filters, search, selectedTenantId],
    );

    useEffect(() => {
        fetchData();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data, loading, error, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    };
}
