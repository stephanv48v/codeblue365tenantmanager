import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type Mailbox = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    email: string;
    type: string;
    storage_used: number;
    items_count: number;
    last_activity: string | null;
};

export type ForwardingRule = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user: string;
    forwarding_target: string;
    type: string;
    is_external: boolean;
    status: string;
};

export type MailFlowRule = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    rule_name: string;
    state: string;
    priority: number;
    description: string;
};

export type DistributionList = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    email: string;
    group_type: string;
    member_count: number;
    external_senders_allowed: boolean;
    managed_by: string | null;
};

export type ExchangeOverview = {
    total_mailboxes: number;
    shared_mailboxes: number;
    total_storage_used: number;
    forwarding_rules: number;
    external_forwarding: number;
    mailboxes: Mailbox[];
    forwarding: ForwardingRule[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type ExchangeFilters = {
    type: string;
};

export type UseExchangeReturn = {
    data: ExchangeOverview | null;
    loading: boolean;
    filters: ExchangeFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: ExchangeFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: ExchangeFilters, s?: string) => void;
};

export function useExchangeData(): UseExchangeReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<ExchangeOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ExchangeFilters>({ type: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.type) params.set('type', f.type);

            fetch(`/api/v1/exchange/overview?${params}`)
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

// ── Forwarding-specific hook ────────────────────────────────────────────────

export type ForwardingFilters = {
    is_external: string;
};

export type ForwardingData = {
    total: number;
    external_count: number;
    internal_count: number;
    items: ForwardingRule[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type UseForwardingReturn = {
    data: ForwardingData | null;
    loading: boolean;
    filters: ForwardingFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: ForwardingFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: ForwardingFilters, s?: string) => void;
};

export function useForwardingData(): UseForwardingReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<ForwardingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ForwardingFilters>({ is_external: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.is_external) params.set('is_external', f.is_external);

            fetch(`/api/v1/exchange/forwarding?${params}`)
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

// ── Mail Flow Rules hook ────────────────────────────────────────────────────

export type MailFlowData = {
    total: number;
    enabled: number;
    disabled: number;
    items: MailFlowRule[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type MailFlowFilters = {
    state: string;
};

export type UseMailFlowReturn = {
    data: MailFlowData | null;
    loading: boolean;
    filters: MailFlowFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: MailFlowFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: MailFlowFilters, s?: string) => void;
};

export function useMailFlowData(): UseMailFlowReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<MailFlowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<MailFlowFilters>({ state: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.state) params.set('state', f.state);

            fetch(`/api/v1/exchange/mail-flow?${params}`)
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

// ── Distribution Lists hook ─────────────────────────────────────────────────

export type DistributionListsData = {
    total: number;
    external_senders_count: number;
    items: DistributionList[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type DistributionFilters = {
    group_type: string;
};

export type UseDistributionListsReturn = {
    data: DistributionListsData | null;
    loading: boolean;
    filters: DistributionFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: DistributionFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: DistributionFilters, s?: string) => void;
};

export function useDistributionListsData(): UseDistributionListsReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<DistributionListsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<DistributionFilters>({ group_type: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.group_type) params.set('group_type', f.group_type);

            fetch(`/api/v1/exchange/distribution-lists?${params}`)
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
