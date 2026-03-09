import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type CopilotUsageItem = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    user_principal_name: string;
    copilot_license_assigned: boolean;
    last_activity_date: string | null;
    last_activity_teams: string | null;
    last_activity_word: string | null;
    last_activity_excel: string | null;
    last_activity_powerpoint: string | null;
    last_activity_outlook: string | null;
    last_activity_onenote: string | null;
    last_activity_copilot_chat: string | null;
};

export type UsageByApp = {
    teams: number;
    word: number;
    excel: number;
    powerpoint: number;
    outlook: number;
    onenote: number;
    copilot_chat: number;
};

export type CopilotUsageData = {
    total_licensed: number;
    total_active: number;
    adoption_rate: number;
    usage_by_app: UsageByApp;
    items: CopilotUsageItem[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export type UsageFilters = {
    licensed: string;
    active: string;
};

export type UseCopilotUsageReturn = {
    data: CopilotUsageData | null;
    loading: boolean;
    filters: UsageFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: UsageFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchUsage: (pg?: number, pp?: number, f?: UsageFilters, s?: string) => void;
};

export function useCopilotUsage(): UseCopilotUsageReturn {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<CopilotUsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UsageFilters>({ licensed: '', active: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchUsage = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.licensed) params.set('licensed', f.licensed);
            if (f.active) params.set('active', f.active);

            fetch(`/api/v1/copilot/usage?${params}`)
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
        fetchUsage();
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
        fetchUsage,
    };
}
