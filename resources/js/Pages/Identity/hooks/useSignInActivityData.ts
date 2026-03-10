import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type SignInActivityData = {
    total_sign_ins_30d: number;
    success_rate: number;
    failed_sign_ins_30d: number;
    unique_users_30d: number;
    trend: Array<{ date: string; successful: number; failed: number }>;
    failure_reasons: Array<{ reason: string; count: number }>;
    top_locations: Array<{ country: string; city: string; count: number }>;
    by_tenant: Array<{
        tenant_id: string;
        customer_name: string;
        total: number;
        failed: number;
        success_rate: number;
    }>;
};

export type UseSignInActivityReturn = {
    data: SignInActivityData | null;
    loading: boolean;
};

export function useSignInActivityData(): UseSignInActivityReturn {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<UseSignInActivityReturn>({ data: null, loading: true });

    useEffect(() => {
        setData((prev) => ({ ...prev, loading: true }));
        fetch(buildUrl('/api/v1/identity/sign-in-activity'))
            .then((r) => r.json())
            .then((res) => {
                setData({ data: res.success ? res.data : null, loading: false });
            })
            .catch(() => setData({ data: null, loading: false }));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return data;
}
