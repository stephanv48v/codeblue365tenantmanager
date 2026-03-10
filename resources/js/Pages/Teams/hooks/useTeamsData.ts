import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type Team = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    visibility: string;
    member_count: number;
    channel_count: number;
    guest_count: number;
    is_archived: boolean;
    last_activity: string | null;
};

export type TeamsOverview = {
    total_teams: number;
    active_users: number;
    total_messages_30d: number;
    meetings_organized: number;
    calls: number;
    message_types: Array<{ type: string; count: number }>;
    items: Team[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type TeamsFilters = {
    visibility: string;
};

export type UseTeamsReturn = {
    data: TeamsOverview | null;
    loading: boolean;
    filters: TeamsFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: TeamsFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: TeamsFilters, s?: string) => void;
};

export function useTeamsData(): UseTeamsReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<TeamsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TeamsFilters>({ visibility: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.visibility) params.set('visibility', f.visibility);

            fetch(`/api/v1/teams/overview?${params}`)
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

// ── Teams Usage hook ────────────────────────────────────────────────────────

export type UsageMetric = {
    date: string;
    messages: number;
    meetings: number;
    calls: number;
};

export type UserUsage = {
    id: number;
    display_name: string;
    user_principal_name: string;
    messages_sent: number;
    meetings_attended: number;
    calls_made: number;
    meeting_minutes: number;
    last_activity: string | null;
};

export type TeamsUsageData = {
    total_messages: number;
    total_meetings: number;
    total_calls: number;
    avg_meeting_minutes: number;
    trend: UsageMetric[];
    user_activity: UserUsage[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type UseTeamsUsageReturn = {
    data: TeamsUsageData | null;
    loading: boolean;
    search: string;
    page: number;
    perPage: number;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, s?: string) => void;
};

export function useTeamsUsageData(): UseTeamsUsageReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<TeamsUsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);

            fetch(`/api/v1/teams/usage?${params}`)
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
        [page, perPage, search, selectedTenantId],
    );

    useEffect(() => {
        fetchData();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, search, page, perPage, setSearch, setPage, setPerPage, fetchData };
}
