import { useState, useEffect, useCallback } from 'react';

type AuditLog = {
    id: number;
    event_type: string;
    actor_identifier: string | null;
    payload: string | null;
    created_at: string;
};

type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type ThresholdSetting = {
    id: number;
    key: string;
    value: unknown;
    group: string;
    description: string | null;
};

type AuditFilters = {
    event_type: string;
    actor: string;
    date_from: string;
    date_to: string;
    search: string;
};

export type { AuditLog, Pagination, ThresholdSetting, AuditFilters };

export default function useAdminData() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, per_page: 25, current_page: 1, last_page: 1 });
    const [eventTypes, setEventTypes] = useState<string[]>([]);
    const [thresholds, setThresholds] = useState<ThresholdSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [thresholdsLoading, setThresholdsLoading] = useState(true);
    const [filters, setFilters] = useState<AuditFilters>({ event_type: '', actor: '', date_from: '', date_to: '', search: '' });

    const fetchAuditLogs = useCallback(async (page = 1, perPage = 25, currentFilters?: AuditFilters) => {
        setLoading(true);
        const f = currentFilters ?? filters;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        if (f.event_type) params.set('event_type', f.event_type);
        if (f.actor) params.set('actor', f.actor);
        if (f.date_from) params.set('date_from', f.date_from);
        if (f.date_to) params.set('date_to', f.date_to);
        if (f.search) params.set('search', f.search);

        try {
            const res = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setAuditLogs(data.data.items ?? []);
                setPagination(data.data.pagination ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 });
                setEventTypes(data.data.event_types ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchThresholds = useCallback(async () => {
        setThresholdsLoading(true);
        try {
            const res = await fetch('/api/v1/settings/group/thresholds');
            const data = await res.json();
            if (data.success) {
                setThresholds(data.data.items ?? []);
            }
        } finally {
            setThresholdsLoading(false);
        }
    }, []);

    const saveThresholds = useCallback(async (settings: { key: string; value: unknown }[]) => {
        const res = await fetch('/api/v1/settings/group/thresholds', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings }),
        });
        const data = await res.json();
        if (data.success) {
            await fetchThresholds();
        }
        return data.success;
    }, [fetchThresholds]);

    useEffect(() => {
        fetchAuditLogs();
        fetchThresholds();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        auditLogs,
        pagination,
        eventTypes,
        thresholds,
        loading,
        thresholdsLoading,
        filters,
        setFilters,
        fetchAuditLogs,
        fetchThresholds,
        saveThresholds,
    };
}
