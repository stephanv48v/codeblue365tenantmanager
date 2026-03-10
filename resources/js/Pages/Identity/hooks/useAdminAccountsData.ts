import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type AdminAccount = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user_id: string;
    user_principal_name: string | null;
    display_name: string | null;
    role_id: string;
    role_display_name: string;
    assignment_type: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    is_built_in_role: boolean;
};

export type AdminAccountsData = {
    total_admins: number;
    global_admins: number;
    roles_in_use: number;
    pim_eligible: number;
    items: AdminAccount[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
    by_role: Array<{ role_display_name: string; count: number }>;
    tenants_with_excessive_admins: Array<{ tenant_id: string; customer_name: string; global_admin_count: number }>;
};

export type AdminFilters = {
    role: string;
    status: string;
};

export type UseAdminAccountsReturn = {
    data: AdminAccountsData | null;
    loading: boolean;
    filters: AdminFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: AdminFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchAdmins: (pg?: number, pp?: number, f?: AdminFilters, s?: string) => void;
};

export function useAdminAccountsData(): UseAdminAccountsReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<AdminAccountsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AdminFilters>({ role: '', status: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchAdmins = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.role) params.set('role', f.role);
            if (f.status) params.set('status', f.status);

            fetch(`/api/v1/identity/admin-accounts?${params}`)
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
        fetchAdmins();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, filters, search, page, perPage, setFilters, setSearch, setPage, setPerPage, fetchAdmins };
}
