import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type RiskyUser = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user_id: string;
    user_principal_name: string | null;
    display_name: string | null;
    risk_level: string;
    risk_state: string;
    risk_detail: string | null;
    risk_last_updated_at: string | null;
};

export type RiskyUsersData = {
    total: number;
    high: number;
    medium: number;
    remediated: number;
    items: RiskyUser[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type RiskyFilters = {
    risk_level: string;
    risk_state: string;
};

export type UseRiskyUsersReturn = {
    data: RiskyUsersData | null;
    loading: boolean;
    filters: RiskyFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: RiskyFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchRiskyUsers: (pg?: number, pp?: number, f?: RiskyFilters, s?: string) => void;
};

export function useRiskyUsersData(): UseRiskyUsersReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<RiskyUsersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<RiskyFilters>({ risk_level: '', risk_state: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchRiskyUsers = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.risk_level) params.set('risk_level', f.risk_level);
            if (f.risk_state) params.set('risk_state', f.risk_state);

            fetch(`/api/v1/identity/risky-users?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    setLoading(false);
                })
                .catch(() => {
                    setData(null);
                    setLoading(false);
                });
        },
        [page, perPage, filters, search, selectedTenantId],
    );

    useEffect(() => {
        fetchRiskyUsers();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, filters, search, page, perPage, setFilters, setSearch, setPage, setPerPage, fetchRiskyUsers };
}
