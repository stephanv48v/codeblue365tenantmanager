import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type ServiceHealthOverview = {
    active_incidents: number;
    advisories: number;
    affected_services: number;
    resolved_7d: number;
    events_by_service: Array<{ service: string; count: number }>;
    recent_events: Array<ServiceHealthEvent>;
};

export type ServiceHealthEvent = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    event_id: string;
    service: string;
    title: string;
    classification: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
};

type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type EventFilters = {
    classification: string;
    service: string;
    status: string;
};

export type { Pagination, EventFilters };

export function useServiceHealthData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [overview, setOverview] = useState<ServiceHealthOverview | null>(null);
    const [events, setEvents] = useState<ServiceHealthEvent[]>([]);
    const [eventsPagination, setEventsPagination] = useState<Pagination>({
        total: 0, per_page: 25, current_page: 1, last_page: 1,
    });
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [filters, setFilters] = useState<EventFilters>({ classification: '', service: '', status: '' });

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/service-health/overview'))
            .then((r) => r.json())
            .then((res) => {
                setOverview(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchEvents = useCallback(async (page = 1, perPage = 25, currentFilters?: EventFilters) => {
        setEventsLoading(true);
        const f = currentFilters ?? filters;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        if (selectedTenantId) params.set('tenant_id', selectedTenantId);
        if (f.classification) params.set('classification', f.classification);
        if (f.service) params.set('service', f.service);
        if (f.status) params.set('status', f.status);

        try {
            const res = await fetch(`/api/v1/service-health/events?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setEvents(data.data.items ?? []);
                setEventsPagination(data.data.pagination ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 });
            }
        } finally {
            setEventsLoading(false);
        }
    }, [filters, selectedTenantId]);

    useEffect(() => {
        fetchEvents();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        overview,
        loading,
        events,
        eventsPagination,
        eventsLoading,
        filters,
        setFilters,
        fetchEvents,
    };
}
