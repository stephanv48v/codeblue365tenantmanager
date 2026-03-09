import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type CopilotAgent = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    agent_id: string;
    display_name: string;
    description: string | null;
    agent_type: 'declarative' | 'custom_engine';
    status: 'active' | 'disabled' | 'blocked';
    created_by: string | null;
    data_sources: string | null;
    last_activity_at: string | null;
    interaction_count: number;
};

export type AgentsResponse = {
    total: number;
    active: number;
    disabled: number;
    blocked: number;
    by_type: { declarative: number; custom_engine: number };
    items: CopilotAgent[];
};

export type AgentFilters = {
    status: string;
    type: string;
};

export type UseCopilotAgentsReturn = {
    data: AgentsResponse | null;
    loading: boolean;
    filters: AgentFilters;
    search: string;
    setFilters: (filters: AgentFilters) => void;
    setSearch: (search: string) => void;
    refetch: (f?: AgentFilters, s?: string) => void;
};

export function useCopilotAgents(): UseCopilotAgentsReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<AgentsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AgentFilters>({ status: '', type: '' });
    const [search, setSearch] = useState('');

    const refetch = useCallback(
        (f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.status) params.set('status', f.status);
            if (f.type) params.set('type', f.type);

            const qs = params.toString();
            fetch(`/api/v1/copilot/agents${qs ? `?${qs}` : ''}`)
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
        [filters, search, selectedTenantId],
    );

    useEffect(() => {
        refetch();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        filters,
        search,
        setFilters,
        setSearch,
        refetch,
    };
}
