"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export function TaskBoard({ projectId }: { projectId: string }) {
    // New Task State
    const [title, setTitle] = useState("");

    // Edit Task State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const utils = api.useUtils();

    // 1. Fetch
    const { data: tasks, isLoading } = api.task.getByProjectId.useQuery({ projectId });

    // 2. Create
    const createTask = api.task.create.useMutation({
        onSuccess: () => {
            setTitle("");
            void utils.task.getByProjectId.invalidate({ projectId });
        },
    });

    // 3. Status Update
    const updateStatus = api.task.updateStatus.useMutation({
        onSuccess: () => {
            void utils.task.getByProjectId.invalidate({ projectId });
        }
    });

    // 4. Rename Update
    const updateTask = api.task.update.useMutation({
        onSuccess: () => {
            setEditingTaskId(null); // Close the input field
            void utils.task.getByProjectId.invalidate({ projectId });
        }
    });

    // 5. Delete
    const deleteTask = api.task.delete.useMutation({
        onSuccess: () => {
            void utils.task.getByProjectId.invalidate({ projectId });
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

                {createTask.error && (
                    <p className="text-sm font-medium text-red-500">
                        {createTask.error.data?.zodError?.fieldErrors?.title?.[0] ?? createTask.error.message}
                    </p>
                )}
            </form>

            {/* THE TASK LIST */}
            <div className="grid gap-3">
                {tasks?.length === 0 ? (
                    <p className="text-sm italic text-slate-500">No tasks yet. Create one above!</p>
                ) : (
                    tasks?.map((task) => {
                        // Check if THIS specific task is the one being edited
                        const isEditing = editingTaskId === task.id;

                        return (
                            <div key={task.id} className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                                {/* LEFT SIDE: Title or Edit Form */}
                                <div className="flex-1">
                                    {isEditing ? (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                updateTask.mutate({ taskId: task.id, title: editTitle });
                                            }}
                                            className="flex gap-2"
                                        >
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="flex-1 rounded-md border p-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                autoFocus
                                            />
                                            <Button size="sm" type="submit" disabled={updateTask.isPending}>
                                                Save
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingTaskId(null)}>
                                                Cancel
                                            </Button>
                                        </form>
                                    ) : (
                                        <div>
                                            <p className={`font-medium ${task.status === "DONE" ? "text-slate-400 line-through" : ""}`}>
                                                {task.title}
                                            </p>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                {task.status.replace("_", " ")}
                                            </span>
                                        </div>
                                    )}

                                    {/* Error message for editing */}
                                    {isEditing && updateTask.error && (
                                        <p className="mt-1 text-xs font-medium text-red-500">
                                            {updateTask.error.data?.zodError?.fieldErrors?.title?.[0] ?? updateTask.error.message}
                                        </p>
                                    )}
                                </div>

                                {/* RIGHT SIDE: Action Buttons (Only show if not editing) */}
                                {!isEditing && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingTaskId(task.id);
                                                setEditTitle(task.title); // Pre-fill the input with the current title
                                            }}
                                        >
                                            Edit
                                        </Button>

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

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                if (window.confirm("Delete this task forever?")) {
                                                    deleteTask.mutate({ taskId: task.id });
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}