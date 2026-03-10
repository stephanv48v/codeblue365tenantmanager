import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type PowerApp = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    owner: string;
    environment: string;
    type: string;
    sessions_30d: number;
    shared_users: number;
    status: string;
};

export type PowerFlow = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    owner: string;
    type: string;
    status: string;
    runs_30d: number;
    failures_30d: number;
    is_premium: boolean;
    is_external: boolean;
};

export type PowerPlatformSummary = {
    total_apps: number;
    total_flows: number;
    flows_with_failures: number;
    premium_connector_usage: number;
    external_connections: number;
};

export type PowerPlatformData = {
    summary: PowerPlatformSummary;
    apps: PowerApp[];
    flows: PowerFlow[];
};

export function usePowerPlatformData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<PowerPlatformData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(buildUrl('/api/v1/power-platform/overview'))
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                if (!res.success) setError('Failed to load Power Platform data');
            })
            .catch(() => {
                setData(null);
                setError('Failed to load Power Platform data');
            })
            .finally(() => setLoading(false));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
