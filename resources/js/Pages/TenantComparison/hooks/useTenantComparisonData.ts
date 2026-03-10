import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type TenantBenchmark = {
    tenant_id: string;
    customer_name: string;
    secure_score: number;
    mfa_coverage: number;
    device_compliance: number;
    copilot_adoption: number;
    conditional_access_policies: number;
    admin_mfa_coverage: number;
    stale_accounts: number;
    license_utilization: number;
};

export type FleetAverages = {
    secure_score: number;
    mfa_coverage: number;
    device_compliance: number;
    copilot_adoption: number;
    conditional_access_policies: number;
    admin_mfa_coverage: number;
    stale_accounts: number;
    license_utilization: number;
};

export type TenantComparisonData = {
    fleet_averages: FleetAverages;
    tenants: TenantBenchmark[];
};

export function useTenantComparisonData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<TenantComparisonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(buildUrl('/api/v1/tenant-comparison/benchmarks'))
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                if (!res.success) setError('Failed to load comparison data');
            })
            .catch(() => {
                setData(null);
                setError('Failed to load comparison data');
            })
            .finally(() => setLoading(false));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
