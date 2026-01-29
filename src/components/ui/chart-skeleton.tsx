export function ChartSkeleton() {
    return (
        <div className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="text-right">
                    <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-20"></div>
                </div>
            </div>
            <div className="h-64 bg-gray-100 rounded"></div>
        </div>
    );
}
