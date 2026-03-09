import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';

type FilterOption = {
    value: string;
    label: string;
};

type FilterConfig = {
    key: string;
    label: string;
    options: FilterOption[];
};

type Props = {
    filters: FilterConfig[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    onReset?: () => void;
};

export default function FilterBar({ filters, values, onChange, search, onReset }: Props) {
    const hasActiveFilters = Object.values(values).some((v) => v !== '') || (search && search.value !== '');

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            {search && (
                <div className="relative min-w-[200px] flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search.value}
                        onChange={(e) => search.onChange(e.target.value)}
                        placeholder={search.placeholder ?? 'Search...'}
                        className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            )}

            {filters.map((filter) => (
                <select
                    key={filter.key}
                    value={values[filter.key] ?? ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">{filter.label}</option>
                    {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ))}

            {hasActiveFilters && onReset && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Clear
                </button>
            )}
        </div>
    );
}
