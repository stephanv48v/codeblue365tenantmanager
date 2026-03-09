import { useState, useRef, useEffect, useCallback } from 'react';
import { BuildingOfficeIcon, ChevronUpDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTenantContext, type TenantOption } from '../contexts/TenantContext';

const gdapDot: Record<string, string> = {
    active: 'bg-emerald-400',
    pending: 'bg-amber-400',
    expired: 'bg-red-400',
    unknown: 'bg-slate-400',
};

export default function TenantSelector() {
    const { tenants, selectedTenantId, selectedTenant, setSelectedTenantId, loading } = useTenantContext();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filtered = tenants.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return t.customer_name.toLowerCase().includes(q) || t.primary_domain.toLowerCase().includes(q);
    });

    // "All Tenants" is index 0, then filtered tenants follow
    const totalItems = filtered.length + 1;

    const select = useCallback((id: string | null) => {
        setSelectedTenantId(id);
        setOpen(false);
        setSearch('');
        setHighlightIdx(-1);
    }, [setSelectedTenantId]);

    // Click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
                setHighlightIdx(-1);
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Focus search when opening
    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                setOpen(false);
                setSearch('');
                setHighlightIdx(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIdx((prev) => Math.min(prev + 1, totalItems - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIdx((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightIdx === 0) {
                    select(null);
                } else if (highlightIdx > 0 && highlightIdx <= filtered.length) {
                    select(filtered[highlightIdx - 1].tenant_id);
                }
                break;
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current && highlightIdx >= 0) {
            const items = listRef.current.querySelectorAll('[data-item]');
            items[highlightIdx]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIdx]);

    const displayName = selectedTenant ? selectedTenant.customer_name : 'All Tenants';

    if (loading) {
        return (
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Loading...</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    selectedTenant
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0" />
                <span className="max-w-[100px] truncate font-medium md:max-w-[160px]">{displayName}</span>
                <ChevronUpDownIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
                    {/* Search */}
                    <div className="border-b border-slate-100 p-2">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search tenants..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setHighlightIdx(-1); }}
                                className="flex-1 border-0 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div ref={listRef} className="max-h-64 overflow-y-auto py-1" role="listbox">
                        {/* All Tenants option */}
                        <button
                            data-item
                            onClick={() => select(null)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                highlightIdx === 0 ? 'bg-blue-50' : 'hover:bg-slate-50'
                            }`}
                            role="option"
                            aria-selected={selectedTenantId === null}
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                <BuildingOfficeIcon className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">All Tenants</p>
                                <p className="text-xs text-slate-400">{tenants.length} managed tenants</p>
                            </div>
                            {selectedTenantId === null && (
                                <CheckIcon className="h-4 w-4 flex-shrink-0 text-blue-600" />
                            )}
                        </button>

                        <div className="mx-3 my-1 border-t border-slate-100" />

                        {/* Tenant list */}
                        {filtered.map((tenant, idx) => {
                            const itemIdx = idx + 1;
                            const isSelected = selectedTenantId === tenant.tenant_id;
                            return (
                                <button
                                    key={tenant.tenant_id}
                                    data-item
                                    onClick={() => select(tenant.tenant_id)}
                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                                        highlightIdx === itemIdx ? 'bg-blue-50' : 'hover:bg-slate-50'
                                    }`}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                                        <span className="text-xs font-semibold text-slate-500">
                                            {tenant.customer_name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="truncate text-sm font-medium text-slate-700">
                                                {tenant.customer_name}
                                            </p>
                                            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${gdapDot[tenant.gdap_status] ?? gdapDot.unknown}`} />
                                        </div>
                                        <p className="truncate text-xs text-slate-400">{tenant.primary_domain}</p>
                                    </div>
                                    {isSelected && (
                                        <CheckIcon className="h-4 w-4 flex-shrink-0 text-blue-600" />
                                    )}
                                </button>
                            );
                        })}

                        {filtered.length === 0 && search && (
                            <div className="px-3 py-6 text-center text-sm text-slate-400">
                                No tenants match "{search}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
