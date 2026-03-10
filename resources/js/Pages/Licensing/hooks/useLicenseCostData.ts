import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type LicenseCostItem = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    sku_friendly_name: string;
    purchased_units: number;
    assigned_units: number;
    active_units: number;
    cost_per_unit: number;
    total_monthly_cost: number;
    wasted_monthly_cost: number;
    optimization_recommendation: string | null;
};

export type LicenseCostSummary = {
    total_monthly_spend: number;
    total_wasted: number;
    potential_savings: number;
    license_utilization_percent: number;
};

export type LicenseCostData = {
    summary: LicenseCostSummary;
    items: LicenseCostItem[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export function useLicenseCostData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<LicenseCostData | null>(null);
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

            fetch(`/api/v1/licensing/cost-analysis?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load license cost data');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load license cost data');
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
