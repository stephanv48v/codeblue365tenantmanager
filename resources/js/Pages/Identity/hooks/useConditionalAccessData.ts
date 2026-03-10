import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type CaPolicy = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    policy_id: string;
    display_name: string;
    state: string;
    conditions: string;
    grant_controls: string;
};

export type CaData = {
    total: number;
    enabled: number;
    report_only: number;
    disabled: number;
    items: CaPolicy[];
};

export type CaFilters = {
    state: string;
};

export type UseCaReturn = {
    data: CaData | null;
    loading: boolean;
    filters: CaFilters;
    search: string;
    setFilters: (f: CaFilters) => void;
    setSearch: (s: string) => void;
    fetchPolicies: (f?: CaFilters, s?: string) => void;
};

export function useConditionalAccessData(): UseCaReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<CaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<CaFilters>({ state: '' });
    const [search, setSearch] = useState('');

    const fetchPolicies = (f = filters, s = search) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedTenantId) params.set('tenant_id', selectedTenantId);
        if (f.state) params.set('state', f.state);
        if (s) params.set('search', s);

        fetch(`/api/v1/identity/conditional-access?${params}`)
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => {
                setData(null);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPolicies();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, filters, search, setFilters, setSearch, fetchPolicies };
}
