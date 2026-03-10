import { useEffect, useRef, useState } from 'react';
import { ArrowDownTrayIcon, ChevronDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTenantScope } from '../hooks/useTenantScope';

type ExportButtonProps = {
    csvEndpoint?: string;
    onExportPdf?: () => void;
    pdfGenerating?: boolean;
    csvLabel?: string;
    pdfLabel?: string;
};

export default function ExportButton({
    csvEndpoint,
    onExportPdf,
    pdfGenerating = false,
    csvLabel = 'Export CSV',
    pdfLabel = 'Download PDF',
}: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { buildUrl } = useTenantScope();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    if (!csvEndpoint && !onExportPdf) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
                Export
                <ChevronDownIcon className="h-4 w-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
                    {csvEndpoint && (
                        <button
                            type="button"
                            onClick={() => {
                                window.open(buildUrl(csvEndpoint), '_blank');
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 text-slate-400" />
                            {csvLabel}
                        </button>
                    )}

                    {onExportPdf && (
                        <button
                            type="button"
                            disabled={pdfGenerating}
                            onClick={() => {
                                onExportPdf();
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {pdfGenerating ? (
                                <svg
                                    className="h-4 w-4 animate-spin text-slate-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            ) : (
                                <DocumentTextIcon className="h-4 w-4 text-slate-400" />
                            )}
                            {pdfGenerating ? 'Generating...' : pdfLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
