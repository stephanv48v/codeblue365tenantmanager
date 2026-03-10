import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type Group = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    group_type: string;
    membership_type: string;
    member_count: number;
    owner_count: number;
    visibility: string;
    last_activity: string | null;
};

export type GroupsOverview = {
    total_groups: number;
    m365_groups: number;
    security_groups: number;
    distribution_groups: number;
    mail_enabled_security: number;
    ownerless_groups: number;
    dynamic_groups: number;
    type_distribution: Array<{ type: string; count: number }>;
    items: Group[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type GroupsFilters = {
    group_type: string;
};

export type UseGroupsReturn = {
    data: GroupsOverview | null;
    loading: boolean;
    filters: GroupsFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: GroupsFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: GroupsFilters, s?: string) => void;
};

export function useGroupsData(): UseGroupsReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<GroupsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<GroupsFilters>({ group_type: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.group_type) params.set('group_type', f.group_type);

            fetch(`/api/v1/groups/overview?${params}`)
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
        fetchData();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, filters, search, page, perPage, setFilters, setSearch, setPage, setPerPage, fetchData };
}
