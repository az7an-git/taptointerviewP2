export default function NotificationSettingsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div>
                <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-72 bg-gray-200/50 rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                {/* Left card skeleton */}
                <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-xl space-y-4 h-[240px]">
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    <div className="space-y-2">
                        <div className="h-3 w-20 bg-gray-150 rounded" />
                        <div className="h-10 w-full bg-gray-200/60 rounded-lg" />
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                        <div className="h-4 w-4 bg-gray-200/50 rounded mt-0.5" />
                        <div className="h-3 w-5/6 bg-gray-150 rounded" />
                    </div>
                    <div className="h-9 w-full bg-gray-200 rounded-lg" />
                </div>

                {/* Right card skeleton */}
                <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-xl space-y-5 flex flex-col justify-between h-[240px]">
                    <div className="space-y-4">
                        <div className="h-5 w-48 bg-gray-200 rounded" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-24 bg-gray-150 rounded" />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-10 bg-gray-200/60 rounded-lg" />
                                <div className="h-10 bg-gray-200/60 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="h-3.5 w-28 bg-gray-150 rounded" />
                            <div className="flex justify-between items-center p-2.5 bg-gray-200/40 rounded-lg h-14">
                                <div className="space-y-1.5">
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-3 w-56 bg-gray-150 rounded" />
                                </div>
                                <div className="h-4 w-4 bg-gray-250/50 rounded" />
                            </div>
                        </div>
                    </div>
                    <div className="h-9 w-full bg-gray-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
