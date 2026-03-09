import { XMarkIcon } from '@heroicons/react/20/solid';

type Action = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'default';
};

type Props = {
    selectedCount: number;
    actions: Action[];
    onClearSelection: () => void;
};

const variantStyles: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    default: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
};

export default function BulkActionBar({ selectedCount, actions, onClearSelection }: Props) {
    if (selectedCount === 0) return null;

    return (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                    {selectedCount}
                </span>
                <span className="text-sm font-medium text-blue-900">
                    {selectedCount === 1 ? 'item selected' : 'items selected'}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${variantStyles[action.variant ?? 'default']}`}
                    >
                        {action.label}
                    </button>
                ))}
                <button
                    onClick={onClearSelection}
                    className="ml-2 rounded-md p-1.5 text-blue-600 hover:bg-blue-100"
                    title="Clear selection"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
