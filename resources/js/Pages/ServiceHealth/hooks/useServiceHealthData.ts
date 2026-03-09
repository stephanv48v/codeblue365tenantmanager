import { useEffect, useState } from 'react';

export type ServiceHealthOverview = {
    active_incidents: number;
    advisories: number;
    affected_services: number;
    resolved_7d: number;
    events_by_service: Array<{ service: string; count: number }>;
    recent_events: Array<{
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
    }>;
};

export type ServiceHealthData = {
    overview: ServiceHealthOverview | null;
    loading: boolean;
};

export function useServiceHealthData(): ServiceHealthData {
    const [data, setData] = useState<ServiceHealthData>({ overview: null, loading: true });

    useEffect(() => {
        fetch('/api/v1/service-health/overview')
            .then((r) => r.json())
            .then((res) => {
                setData({
                    overview: res.success ? res.data : null,
                    loading: false,
                });
            })
            .catch(() => setData({ overview: null, loading: false }));
    }, []);

    return data;
}
