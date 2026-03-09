import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type DevicesOverview = {
    total: number;
    compliant: number;
    non_compliant: number;
    compliance_rate: number;
    managed: number;
    unmanaged: number;
    os_distribution: Array<{ os: string; count: number }>;
    compliance_by_tenant: Array<{
        customer_name: string;
        tenant_id: string;
        total: number;
        compliant: number;
    }>;
};

type Device = {
    id: number;
    device_id: string;
    tenant_id: string;
    display_name: string;
    os: string;
    os_version: string;
    compliance_state: string;
    managed_by: string | null;
    last_sync_at: string | null;
    enrolled_at: string | null;
    customer_name: string | null;
};

type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type InventoryFilters = {
    tenant_id: string;
    compliance_status: string;
    os: string;
    managed: string;
    search: string;
};

export type { Device, Pagination, InventoryFilters };

export function useDevicesData() {
    const { selectedTenantId, buildUrl, applyTenantFilter } = useTenantScope();
    const [overview, setOverview] = useState<DevicesOverview | null>(null);
    const [inventory, setInventory] = useState<Device[]>([]);
    const [inventoryPagination, setInventoryPagination] = useState<Pagination>({
        total: 0, per_page: 25, current_page: 1, last_page: 1,
    });
    const [loading, setLoading] = useState(true);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [filters, setFilters] = useState<InventoryFilters>({
        tenant_id: '', compliance_status: '', os: '', managed: '', search: '',
    });

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/devices/overview'))
            .then((r) => r.json())
            .then((res) => {
                setOverview(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchInventory = useCallback(async (page = 1, perPage = 25, currentFilters?: InventoryFilters) => {
        setInventoryLoading(true);
        const f = currentFilters ?? filters;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        // Global tenant selector overrides local tenant filter
        if (selectedTenantId) {
            params.set('tenant_id', selectedTenantId);
        } else if (f.tenant_id) {
            params.set('tenant_id', f.tenant_id);
        }
        if (f.compliance_status) params.set('compliance_status', f.compliance_status);
        if (f.os) params.set('os', f.os);
        if (f.managed) params.set('managed', f.managed);
        if (f.search) params.set('search', f.search);

        try {
            const res = await fetch(`/api/v1/devices/inventory?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setInventory(data.data.items ?? []);
                setInventoryPagination(data.data.pagination ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 });
            }
        } finally {
            setInventoryLoading(false);
        }
    }, [filters, selectedTenantId]);

    useEffect(() => {
        fetchInventory();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        overview,
        loading,
        inventory,
        inventoryPagination,
        inventoryLoading,
        selectedDevice,
        setSelectedDevice,
        filters,
        setFilters,
        fetchInventory,
    };
}
