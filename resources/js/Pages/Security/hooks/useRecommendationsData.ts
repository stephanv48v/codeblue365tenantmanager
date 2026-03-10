import { useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type Recommendation = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    finding_id: number | null;
    priority: string;
    title: string;
    description: string | null;
    action_url: string | null;
    status: string;
    finding_severity: string | null;
    finding_description: string | null;
    finding_category: string | null;
    finding_status: string | null;
    created_at: string;
    updated_at: string;
};

export type RecommendationSummary = {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
};

export type RecommendationFilters = {
    priority: string;
    status: string;
    search: string;
};

export function useRecommendationsData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [items, setItems] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<RecommendationSummary>({ total: 0, open: 0, in_progress: 0, resolved: 0 });
    const [pagination, setPagination] = useState({ total: 0, per_page: 25, current_page: 1, last_page: 1 });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const fetchRecommendations = useCallback(
        (page = 1, perPage = 25, filters: Partial<RecommendationFilters> = {}) => {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('per_page', String(perPage));
            if (filters.priority) params.set('priority', filters.priority);
            if (filters.status) params.set('status', filters.status);
            if (filters.search) params.set('search', filters.search);

            fetch(buildUrl(`/api/v1/recommendations?${params.toString()}`))
                .then((r) => r.json())
                .then((res) => {
                    if (res.success) {
                        setItems(res.data.items);
                        setPagination(res.data.pagination);
                        setSummary(res.data.summary);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        },
        [selectedTenantId, buildUrl], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const bulkUpdate = useCallback(
        async (ids: number[], action: 'start' | 'resolve' | 'reopen') => {
            const res = await fetch(buildUrl('/api/v1/recommendations/bulk-update'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ ids, action }),
            });
            return res.json();
        },
        [buildUrl], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const toggleSelection = useCallback((id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }, []);

    const toggleAll = useCallback(() => {
        setSelectedIds((prev) => (prev.length === items.length ? [] : items.map((i) => i.id)));
    }, [items]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    return {
        items,
        loading,
        summary,
        pagination,
        selectedIds,
        fetchRecommendations,
        bulkUpdate,
        toggleSelection,
        toggleAll,
        clearSelection,
    };
}
