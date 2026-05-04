"use client";

import { api } from "~/trpc/react";

export function ProjectAnalytics({ projectId }: { projectId: string }) {
    // Fetch the highly optimized math from our Waiter
    const { data: stats, isLoading } = api.task.getProjectStats.useQuery({ projectId });

    if (isLoading) {
        return <div className="animate-pulse h-16 w-full rounded-xl bg-slate-100"></div>;
    }

    // Fallback to 0 if data isn't perfectly loaded yet
    const safeStats = stats ?? { totalTasks: 0, completedTasks: 0, progressPercentage: 0 };

    return (
        <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Project Progress</h2>
                    <p className="text-sm text-slate-500">
                        {safeStats.completedTasks} of {safeStats.totalTasks} tasks completed
                    </p>
                </div>
                <div className="text-3xl font-extrabold text-blue-600">
                    {safeStats.progressPercentage}%
                </div>
            </div>

            {/* The Animated Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-in-out"
                    style={{ width: `${safeStats.progressPercentage}%` }}
                />
            </div>
        </div>
    );
}