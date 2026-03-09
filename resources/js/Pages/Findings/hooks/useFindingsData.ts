import { useState, useEffect, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

type Finding = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    category: string;
    severity: string;
    description: string;
    status: string;
    impact: string;
    recommended_remediation: string;
    evidence: string | null;
    rule_key: string | null;
    first_detected_at: string;
    last_detected_at: string;
    resolved_at: string | null;
};

type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type Summary = {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    open: number;
};

type FindingsFilters = {
    tenant_id: string;
    severity: string;
    category: string;
    status: string;
    search: string;
};

export type { Finding, Pagination, Summary, FindingsFilters };

export default function useFindingsData() {
    const { selectedTenantId } = useTenantScope();
    const [findings, setFindings] = useState<Finding[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, per_page: 25, current_page: 1, last_page: 1 });
    const [summary, setSummary] = useState<Summary>({ total: 0, critical: 0, high: 0, medium: 0, low: 0, open: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [filters, setFilters] = useState<FindingsFilters>({ tenant_id: '', severity: '', category: '', status: '', search: '' });

    const fetchFindings = useCallback(async (page = 1, perPage = 25, currentFilters?: FindingsFilters) => {
        setLoading(true);
        const f = currentFilters ?? filters;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        // Global tenant selector overrides local tenant filter
        if (selectedTenantId) {
            params.set('tenant_id', selectedTenantId);
        } else if (f.tenant_id) {
            params.set('tenant_id', f.tenant_id);
        }
        if (f.severity) params.set('severity', f.severity);
        if (f.category) params.set('category', f.category);
        if (f.status) params.set('status', f.status);
        if (f.search) params.set('search', f.search);

        try {
            const res = await fetch(`/api/v1/findings?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setFindings(data.data.items ?? []);
                setPagination(data.data.pagination ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 });
                setSummary(data.data.summary ?? { total: 0, critical: 0, high: 0, medium: 0, low: 0, open: 0 });
            }
        } finally {
            setLoading(false);
        }
    }, [filters, selectedTenantId]);

    const bulkUpdate = useCallback(async (ids: number[], action: 'dismiss' | 'acknowledge' | 'reopen') => {
        const res = await fetch('/api/v1/findings/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, action }),
        });
        const data = await res.json();
        if (data.success) {
            setSelectedIds(new Set());
            await fetchFindings(pagination.current_page, pagination.per_page);
        }
        return data.success;
    }, [fetchFindings, pagination]);

    const toggleSelection = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === findings.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(findings.map((f) => f.id)));
        }
    }, [findings, selectedIds]);

    useEffect(() => {
        fetchFindings();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        findings,
        pagination,
        summary,
        loading,
        selectedFinding,
        setSelectedFinding,
        selectedIds,
        setSelectedIds,
        filters,
        setFilters,
        fetchFindings,
        bulkUpdate,
        toggleSelection,
        toggleAll,
    };
}
