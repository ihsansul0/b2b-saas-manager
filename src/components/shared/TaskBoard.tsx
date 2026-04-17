"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export function TaskBoard({ projectId }: { projectId: string }) {
    const [title, setTitle] = useState("");

    // utils is a powerful tRPC tool that lets us silently refresh data without reloading the page
    const utils = api.useUtils();

    // 1. Fetch the tasks for this specific project
    const { data: tasks, isLoading } = api.task.getByProjectId.useQuery({ projectId });

    // 2. The Create Task Mutation
    const createTask = api.task.create.useMutation({
        onSuccess: () => {
            setTitle(""); // Clear the input
            void utils.task.getByProjectId.invalidate({ projectId }); // Tell tRPC to instantly re-fetch the tasks!
        },
    });

    // 3. The Status Update Mutation
    const updateStatus = api.task.updateStatus.useMutation({
        onSuccess: () => {
            void utils.task.getByProjectId.invalidate({ projectId }); // Instantly re-fetch tasks when status changes
        }
    });

    if (isLoading) return <div className="animate-pulse text-slate-500">Loading tasks...</div>;

    return (
        <div className="space-y-6">
            {/* THE CREATION FORM */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    createTask.mutate({ title, projectId });
                }}
                className="mb-6 flex flex-col gap-2"
            >
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="flex-1 rounded-md border p-2 text-sm"
                        disabled={createTask.isPending}
                    />
                    <Button type="submit" disabled={createTask.isPending}>
                        {createTask.isPending ? "Adding..." : "Add Task"}
                    </Button>
                </div>

                {/* If Zod rejects the order, display the exact message in red! */}
                {/* Look for the specific Zod field error first! */}
                {createTask.error && (
                    <p className="text-sm font-medium text-red-500">
                        {createTask.error.data?.zodError?.fieldErrors?.title?.[0] ?? createTask.error.message}
                    </p>
                )}
            </form>

            {/* THE TASK LIST */}
            <div className="grid gap-3">
                {tasks?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No tasks yet. Create one above!</p>
                ) : (
                    tasks?.map((task) => (
                        <div key={task.id} className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                            <div>
                                <p className={`font-medium ${task.status === "DONE" ? "text-slate-400 line-through" : ""}`}>
                                    {task.title}
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {task.status.replace("_", " ")}
                                </span>
                            </div>

                            {/* STATUS BUTTONS */}
                            <div className="flex gap-2">
                                {task.status === "TODO" && (
                                    <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ taskId: task.id, status: "IN_PROGRESS" })}>
                                        Start Work
                                    </Button>
                                )}
                                {task.status === "IN_PROGRESS" && (
                                    <Button size="sm" onClick={() => updateStatus.mutate({ taskId: task.id, status: "DONE" })}>
                                        Mark Done
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}