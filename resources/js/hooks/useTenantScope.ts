import { useTenantContext } from '../contexts/TenantContext';

export function useTenantScope() {
    const { selectedTenantId, selectedTenant, isFiltered } = useTenantContext();

    /** Append tenant_id to an existing URLSearchParams if a tenant is selected */
    function applyTenantFilter(params: URLSearchParams): URLSearchParams {
        if (selectedTenantId) {
            params.set('tenant_id', selectedTenantId);
        }
        return params;
    }

    /** Build a URL string, appending tenant_id (and optional extra params) when filtered */
    function buildUrl(base: string, extraParams?: Record<string, string>): string {
        const params = new URLSearchParams(extraParams);
        applyTenantFilter(params);
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    }

    return {
        selectedTenantId,
        selectedTenant,
        isFiltered,
        applyTenantFilter,
        buildUrl,
    };
}
