import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { router } from '@inertiajs/react';

export type TenantOption = {
    tenant_id: string;
    customer_name: string;
    primary_domain: string;
    gdap_status: string;
};

type TenantContextValue = {
    selectedTenantId: string | null;
    selectedTenant: TenantOption | null;
    tenants: TenantOption[];
    setSelectedTenantId: (id: string | null) => void;
    isFiltered: boolean;
    loading: boolean;
    refreshTenants: () => void;
};

const STORAGE_KEY = 'codeblue365_selected_tenant';

const TenantContext = createContext<TenantContextValue | null>(null);

function getInitialTenantId(): string | null {
    // Priority: URL param > localStorage > null
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('tenant');
    if (fromUrl) return fromUrl;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
    } catch {
        // localStorage unavailable
    }

    return null;
}

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenants, setTenants] = useState<TenantOption[]>([]);
    const [selectedTenantId, setSelectedTenantIdRaw] = useState<string | null>(getInitialTenantId);
    const [loading, setLoading] = useState(true);

    const selectedTenant = tenants.find((t) => t.tenant_id === selectedTenantId) ?? null;
    const isFiltered = selectedTenantId !== null;

    const fetchTenants = useCallback(() => {
        fetch('/api/v1/tenants?per_page=999')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    const items: TenantOption[] = (res.data.items ?? []).map((t: Record<string, unknown>) => ({
                        tenant_id: t.tenant_id as string,
                        customer_name: t.customer_name as string,
                        primary_domain: t.primary_domain as string,
                        gdap_status: (t.gdap_status as string) ?? 'unknown',
                    }));
                    setTenants(items);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    const setSelectedTenantId = useCallback((id: string | null) => {
        setSelectedTenantIdRaw(id);

        // Persist to localStorage
        try {
            if (id) {
                localStorage.setItem(STORAGE_KEY, id);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // localStorage unavailable
        }

        // Update URL without triggering Inertia navigation
        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set('tenant', id);
        } else {
            url.searchParams.delete('tenant');
        }
        window.history.replaceState({}, '', url.toString());
    }, []);

    // Re-apply tenant param to URL after Inertia page navigation
    useEffect(() => {
        const removeListener = router.on('navigate', () => {
            if (selectedTenantId) {
                requestAnimationFrame(() => {
                    const url = new URL(window.location.href);
                    if (url.searchParams.get('tenant') !== selectedTenantId) {
                        url.searchParams.set('tenant', selectedTenantId);
                        window.history.replaceState({}, '', url.toString());
                    }
                });
            }
        });
        return removeListener;
    }, [selectedTenantId]);

    // Validate selected tenant exists in list once loaded
    useEffect(() => {
        if (!loading && selectedTenantId && tenants.length > 0) {
            const exists = tenants.some((t) => t.tenant_id === selectedTenantId);
            if (!exists) {
                setSelectedTenantId(null);
            }
        }
    }, [loading, tenants, selectedTenantId, setSelectedTenantId]);

    return (
        <TenantContext.Provider
            value={{
                selectedTenantId,
                selectedTenant,
                tenants,
                setSelectedTenantId,
                isFiltered,
                loading,
                refreshTenants: fetchTenants,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenantContext(): TenantContextValue {
    const ctx = useContext(TenantContext);
    if (!ctx) throw new Error('useTenantContext must be used within a TenantProvider');
    return ctx;
}
