import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type AppRegistration = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    app_type: string;
    credential_count: number;
    nearest_credential_expiry: string | null;
    has_admin_consent: boolean;
    api_permissions_count: number;
    last_sign_in: string | null;
};

export type OAuthConsent = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    app_name: string;
    principal_name: string;
    scope: string;
    risk_level: string;
    consent_type: string;
    granted_at: string | null;
};

export type AppRegistrationsOverview = {
    total_apps: number;
    expired_credentials: number;
    expiring_soon: number;
    admin_consented: number;
    high_risk_consents: number;
    items: AppRegistration[];
    oauth_consents: OAuthConsent[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export type AppFilters = {
    app_type: string;
    credential_status: string;
};

export type UseAppRegistrationsReturn = {
    data: AppRegistrationsOverview | null;
    loading: boolean;
    filters: AppFilters;
    search: string;
    page: number;
    perPage: number;
    setFilters: (filters: AppFilters) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchData: (pg?: number, pp?: number, f?: AppFilters, s?: string) => void;
};

export function useAppRegistrationsData(): UseAppRegistrationsReturn {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<AppRegistrationsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AppFilters>({ app_type: '', credential_status: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const fetchData = useCallback(
        (pg = page, pp = perPage, f = filters, s = search) => {
            setLoading(true);
            const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
            if (selectedTenantId) params.set('tenant_id', selectedTenantId);
            if (s) params.set('search', s);
            if (f.app_type) params.set('app_type', f.app_type);
            if (f.credential_status) params.set('credential_status', f.credential_status);

            fetch(`/api/v1/app-registrations/overview?${params}`)
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
