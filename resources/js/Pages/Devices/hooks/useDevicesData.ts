import { useEffect, useState } from 'react';

export type DevicesOverview = {
    total: number;
    compliant: number;
    non_compliant: number;
    compliance_rate: number;
    managed: number;
    unmanaged: number;
    os_distribution: Array<{ operating_system: string; count: number }>;
    compliance_by_tenant: Array<{
        customer_name: string;
        tenant_id: string;
        total: number;
        compliant: number;
    }>;
};

export type DevicesData = {
    overview: DevicesOverview | null;
    loading: boolean;
};

export function useDevicesData(): DevicesData {
    const [data, setData] = useState<DevicesData>({ overview: null, loading: true });

    useEffect(() => {
        fetch('/api/v1/devices/overview')
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
