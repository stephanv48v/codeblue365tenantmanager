import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type AutopilotDevice = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    serial_number: string;
    model: string;
    manufacturer: string;
    enrollment_status: string;
    deployment_profile: string | null;
    group_tag: string | null;
    last_contacted: string | null;
};

export type AutopilotSummary = {
    total_devices: number;
    enrolled: number;
    pending: number;
    failed: number;
};

export type EnrollmentBreakdown = {
    status: string;
    count: number;
};

export type AutopilotData = {
    summary: AutopilotSummary;
    devices: AutopilotDevice[];
    enrollment_breakdown: EnrollmentBreakdown[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export function useAutopilotData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<AutopilotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage) => {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);

            fetch(`/api/v1/devices/autopilot?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load Autopilot data');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load Autopilot data');
                })
                .finally(() => setLoading(false));
        },
        [page, perPage, selectedTenantId],
    );

    useEffect(() => {
        fetchData();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, error, page, perPage, setPage, setPerPage, fetchData };
}
