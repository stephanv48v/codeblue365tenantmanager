import { useEffect, useState } from 'react';

export type IdentityOverview = {
    total_users: number;
    enabled_users: number;
    disabled_users: number;
    mfa_coverage_percent: number;
    mfa_registered: number;
    stale_users: number;
    risky_users_count: number;
    ca_policies_count: number;
    mfa_by_tenant: Array<{
        customer_name: string;
        tenant_id: string;
        total_users: number;
        mfa_users: number;
    }>;
    risky_by_level: Array<{ risk_level: string; count: number }>;
};

export type IdentityData = {
    overview: IdentityOverview | null;
    loading: boolean;
};

export function useIdentityData(): IdentityData {
    const [data, setData] = useState<IdentityData>({ overview: null, loading: true });

    useEffect(() => {
        fetch('/api/v1/identity/overview')
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
