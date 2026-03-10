import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type SecureScoreAction = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    title: string;
    category: string;
    max_score: number;
    current_score: number;
    status: string | null;
    user_impact: string | null;
    implementation: string | null;
    remediation_description: string | null;
};

export type ScoreByCategory = {
    category: string;
    current_score: number;
    max_score: number;
};

export type SecureScoreActionsSummary = {
    total_actions: number;
    completed: number;
    in_progress: number;
    risk_accepted: number;
    potential_points_gain: number;
};

export type SecureScoreActionsData = {
    summary: SecureScoreActionsSummary;
    actions: SecureScoreAction[];
    score_by_category: ScoreByCategory[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type SecureScoreFilters = {
    status: string;
    category: string;
};

export function useSecureScoreActionsData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<SecureScoreActionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SecureScoreFilters>({ status: '', category: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.status) params.set('status', f.status);
            if (f.category) params.set('category', f.category);

            fetch(`/api/v1/security/secure-score-actions?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load secure score actions');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load secure score actions');
                })
                .finally(() => setLoading(false));
        },
        [page, perPage, filters, search, selectedTenantId],
    );

    useEffect(() => {
        fetchData();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data, loading, error, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    };
}
