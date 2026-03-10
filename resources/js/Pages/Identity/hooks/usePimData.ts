import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type PimActivation = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user_principal_name: string;
    display_name: string;
    role_name: string;
    activation_type: string;
    status: string;
    start_date: string;
    end_date: string | null;
    justification: string | null;
};

export type PimSummary = {
    total_eligible: number;
    total_active: number;
    roles: { role_name: string; count: number }[];
};

export type PimData = {
    summary: PimSummary;
    activations: PimActivation[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export function usePimData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<PimData | null>(null);
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

            fetch(`/api/v1/identity/pim-activations?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load PIM data');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load PIM data');
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
