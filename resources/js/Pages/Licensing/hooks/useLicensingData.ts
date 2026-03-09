import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type LicensingOverview = {
    total_licenses: number;
    assigned: number;
    available: number;
    waste_percent: number;
    top_skus: Array<{
        sku_name: string;
        total: number;
        assigned: number;
        available: number;
    }>;
    per_tenant_utilization: Array<{
        customer_name: string;
        tenant_id: string;
        total: number;
        assigned: number;
        available: number;
    }>;
};

export type LicensingData = {
    overview: LicensingOverview | null;
    loading: boolean;
};

export function useLicensingData(): LicensingData {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<LicensingData>({ overview: null, loading: true });

    useEffect(() => {
        setData((prev) => ({ ...prev, loading: true }));
        fetch(buildUrl('/api/v1/licensing/overview'))
            .then((r) => r.json())
            .then((res) => {
                setData({
                    overview: res.success ? res.data : null,
                    loading: false,
                });
            })
            .catch(() => setData({ overview: null, loading: false }));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return data;
}
