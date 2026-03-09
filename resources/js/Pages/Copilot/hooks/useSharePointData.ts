import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type SharePointSite = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    site_id: string;
    site_url: string;
    display_name: string;
    storage_used_bytes: number;
    storage_allocated_bytes: number;
    file_count: number;
    active_file_count: number;
    last_activity_date: string | null;
    page_view_count: number;
    external_sharing: 'anyone' | 'org' | 'existing' | 'disabled';
    is_public: boolean;
    owner_name: string | null;
    owner_email: string | null;
    sensitivity_label: string | null;
    site_template: string | null;
    has_guest_access: boolean;
    permissioned_user_count: number;
    restricted_content_discovery: boolean;
};

export type SharingDistribution = {
    external_sharing: string;
    count: number;
};

export type SharePointData = {
    total_sites: number;
    public_sites: number;
    sites_with_everyone: number;
    sites_with_external_sharing: number;
    sites_with_guests: number;
    average_permissioned_users: number;
    total_storage_used: number;
    total_files: number;
    sensitivity_labels_coverage_pct: number;
    sharing_distribution: SharingDistribution[];
    items: SharePointSite[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export type SharePointFilters = {
    external_sharing: string;
    is_public: string;
    has_guest_access: string;
};

export type UseSharePointDataReturn = {
    data: SharePointData | null;
    loading: boolean;
    filters: SharePointFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: SharePointFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchSites: (pg?: number, pp?: number, f?: SharePointFilters, s?: string) => void;
};

export function useSharePointData(): UseSharePointDataReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<SharePointData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<SharePointFilters>({
        external_sharing: '',
        is_public: '',
        has_guest_access: '',
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchSites = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.external_sharing) params.set('external_sharing', f.external_sharing);
            if (f.is_public) params.set('is_public', f.is_public);
            if (f.has_guest_access) params.set('has_guest_access', f.has_guest_access);

            fetch(`/api/v1/copilot/sharepoint?${params}`)
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
        fetchSites();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        filters,
        search,
        page,
        perPage,
        setFilters,
        setSearch,
        setPage,
        setPerPage,
        fetchSites,
    };
}
