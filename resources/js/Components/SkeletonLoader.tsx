type Variant = 'stat-card' | 'chart' | 'table-row' | 'text';

type Props = {
    variant?: Variant;
    count?: number;
    className?: string;
};

function Pulse({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

function StatCardSkeleton() {
    return (
        <div className="rounded-xl border border-l-4 border-l-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <Pulse className="h-3 w-20" />
                    <Pulse className="mt-2 h-7 w-16" />
                </div>
                <Pulse className="h-10 w-10 rounded-lg" />
            </div>
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Pulse className="mb-4 h-4 w-32" />
            <Pulse className="h-48 w-full rounded-lg" />
        </div>
    );
}

function TableRowSkeleton() {
    return (
        <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-32" />
            <Pulse className="h-4 w-20" />
            <Pulse className="h-5 w-16 rounded-full" />
        </div>
    );
}

function TextSkeleton() {
    return <Pulse className="h-4 w-full" />;
}

export default function SkeletonLoader({ variant = 'stat-card', count = 1, className = '' }: Props) {
    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <div className={className}>
            {items.map((i) => {
                switch (variant) {
                    case 'stat-card':
                        return <StatCardSkeleton key={i} />;
                    case 'chart':
                        return <ChartSkeleton key={i} />;
                    case 'table-row':
                        return <TableRowSkeleton key={i} />;
                    case 'text':
                        return <TextSkeleton key={i} />;
                }
            })}
        </div>
    );
}
