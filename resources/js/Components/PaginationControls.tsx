import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

type Props = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
};

export default function PaginationControls({ currentPage, lastPage, perPage, total, onPageChange, onPerPageChange }: Props) {
    const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);

    const pageNumbers = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        if (lastPage <= 7) {
            for (let i = 1; i <= lastPage; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < lastPage - 2) pages.push('...');
            pages.push(lastPage);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-700">{from}</span> to{' '}
                    <span className="font-medium text-slate-700">{to}</span> of{' '}
                    <span className="font-medium text-slate-700">{total}</span>
                </p>
                {onPerPageChange && (
                    <select
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {[10, 25, 50, 100].map((n) => (
                            <option key={n} value={n}>{n} per page</option>
                        ))}
                    </select>
                )}
            </div>

            <nav className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>

                {pageNumbers().map((page, i) =>
                    page === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-slate-400">…</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[2rem] rounded-md px-2 py-1 text-sm font-medium transition-colors ${
                                page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {page}
                        </button>
                    ),
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </nav>
        </div>
    );
}
