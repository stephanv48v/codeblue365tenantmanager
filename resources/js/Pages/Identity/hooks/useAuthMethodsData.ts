import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type AuthMethodsData = {
    total_users: number;
    mfa_capable_users: number;
    mfa_capable_pct: number;
    methods: {
        authenticator_app: number;
        fido2: number;
        windows_hello: number;
        phone_sms: number;
        phone_call: number;
        email_otp: number;
        password_only: number;
        passwordless: number;
    };
    sspr: {
        capable: number;
        registered: number;
        registered_pct: number;
    };
    by_tenant: Array<{
        tenant_id: string;
        customer_name: string;
        total_users: number;
        mfa_capable_users: number;
        passwordless_count: number;
        sspr_registered_count: number;
    }>;
};

export type UseAuthMethodsReturn = {
    data: AuthMethodsData | null;
    loading: boolean;
};

export function useAuthMethodsData(): UseAuthMethodsReturn {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<UseAuthMethodsReturn>({ data: null, loading: true });

    useEffect(() => {
        setData((prev) => ({ ...prev, loading: true }));
        fetch(buildUrl('/api/v1/identity/auth-methods'))
            .then((r) => r.json())
            .then((res) => {
                setData({ data: res.success ? res.data : null, loading: false });
            })
            .catch(() => setData({ data: null, loading: false }));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return data;
}
