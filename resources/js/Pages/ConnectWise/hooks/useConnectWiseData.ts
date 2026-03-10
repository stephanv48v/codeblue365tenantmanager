import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type ConnectWiseTicket = {
    id: number;
    ticket_id: string;
    summary: string;
    tenant_id: string;
    customer_name: string | null;
    status: string;
    priority: string;
    source: string;
    assigned_to: string | null;
    created_date: string;
};

export type ConnectWiseSummary = {
    open_tickets: number;
    in_progress: number;
    closed_this_month: number;
    critical_priority: number;
};

export type ConnectWiseData = {
    summary: ConnectWiseSummary;
    tickets: ConnectWiseTicket[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type ConnectWiseFilters = {
    status: string;
    priority: string;
};

export function useConnectWiseData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<ConnectWiseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ConnectWiseFilters>({ status: '', priority: '' });
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
            if (f.priority) params.set('priority', f.priority);

            fetch(`/api/v1/connectwise/overview?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load ConnectWise data');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load ConnectWise data');
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
