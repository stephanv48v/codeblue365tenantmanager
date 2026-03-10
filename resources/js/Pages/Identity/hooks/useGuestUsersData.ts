import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type GuestUser = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user_id: string;
    display_name: string | null;
    user_principal_name: string | null;
    mail: string | null;
    user_type: string;
    external_user_state: string | null;
    creation_type: string;
    company_name: string | null;
    domain: string | null;
    created_datetime: string | null;
    last_sign_in_at: string | null;
    account_enabled: boolean;
};

export type GuestUsersData = {
    total_guests: number;
    active_guests: number;
    stale_guests: number;
    pending_acceptance: number;
    disabled_guests: number;
    items: GuestUser[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
    by_domain: Array<{ domain: string; count: number }>;
};

export type GuestFilters = {
    state: string;
};

export type UseGuestUsersReturn = {
    data: GuestUsersData | null;
    loading: boolean;
    filters: GuestFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: GuestFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchGuests: (pg?: number, pp?: number, f?: GuestFilters, s?: string) => void;
};

export function useGuestUsersData(): UseGuestUsersReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<GuestUsersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<GuestFilters>({ state: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchGuests = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.state) params.set('state', f.state);

            fetch(`/api/v1/identity/guest-users?${params}`)
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
        fetchGuests();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, filters, search, page, perPage, setFilters, setSearch, setPage, setPerPage, fetchGuests };
}
