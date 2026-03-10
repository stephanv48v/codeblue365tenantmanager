import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type PasswordHealthUser = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user_principal_name: string;
    display_name: string;
    password_last_set: string | null;
    expiry_date: string | null;
    never_expires: boolean;
    uses_legacy_auth: boolean;
    is_break_glass: boolean;
};

export type PasswordHealthSummary = {
    expiring_within_30d: number;
    never_expire_accounts: number;
    legacy_auth_users: number;
    break_glass_accounts: number;
};

export type PasswordHealthData = {
    summary: PasswordHealthSummary;
    users: PasswordHealthUser[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export function usePasswordHealthData() {
    const { selectedTenantId } = useTenantScope();
    const [data, setData] = useState<PasswordHealthData | null>(null);
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

            fetch(`/api/v1/identity/password-health?${params}`)
                .then((r) => r.json())
                .then((res) => {
                    setData(res.success ? res.data : null);
                    if (!res.success) setError('Failed to load password health data');
                })
                .catch(() => {
                    setData(null);
                    setError('Failed to load password health data');
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
