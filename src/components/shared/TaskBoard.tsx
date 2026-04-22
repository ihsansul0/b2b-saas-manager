"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

const COLUMNS = ["TODO", "IN_PROGRESS", "DONE"] as const;

export function TaskBoard({ projectId }: { projectId: string }) {
    const [title, setTitle] = useState("");
    const utils = api.useUtils();

    // 1. Fetch Tasks
    const { data: tasks, isLoading } = api.task.getByProjectId.useQuery({ projectId });

    // 2. Optimistic Create (Ghost ID)
    const createTask = api.task.create.useMutation({
        onMutate: async (newParam) => {
            await utils.task.getByProjectId.cancel({ projectId });
            const prev = utils.task.getByProjectId.getData({ projectId });
            setTitle("");
            utils.task.getByProjectId.setData({ projectId }, (old) => {
                const ghost = {
                    id: `ghost-${crypto.randomUUID()}`,
                    title: newParam.title,
                    status: "TODO" as const,
                    projectId: newParam.projectId,
                    workspaceId: "optimistic",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                return old ? [...old, ghost] : [ghost];
            });
            return { prev };
        },
        onError: (err, newParam, ctx) => {
            if (ctx?.prev) utils.task.getByProjectId.setData({ projectId }, ctx.prev);
            setTitle(newParam.title);
        },
        onSettled: () => void utils.task.getByProjectId.invalidate({ projectId }),
    });

    // 3. Optimistic Status Update (The Magic behind the Drag & Drop)
    const updateStatus = api.task.updateStatus.useMutation({
        onMutate: async (newUpdate) => {
            await utils.task.getByProjectId.cancel({ projectId });
            const prev = utils.task.getByProjectId.getData({ projectId });
            utils.task.getByProjectId.setData({ projectId }, (old) => {
                if (!old) return old;
                return old.map((t) => t.id === newUpdate.taskId ? { ...t, status: newUpdate.status } : t);
            });
            return { prev };
        },
        onError: (err, newUpdate, ctx) => {
            if (ctx?.prev) utils.task.getByProjectId.setData({ projectId }, ctx.prev);
        },
        onSettled: () => void utils.task.getByProjectId.invalidate({ projectId }),
    });

    // 4. The Delete Protocol
    const deleteTask = api.task.delete.useMutation({
        onSuccess: () => void utils.task.getByProjectId.invalidate({ projectId })
    });

    // THE DRAG & DROP ENGINE
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // If dropped outside a valid column, do nothing
        if (!destination) return;

        // If dropped back into the exact same column, do nothing
        if (destination.droppableId === source.droppableId) return;

        // OPTIMISTIC TRIGGER: Fire the mutation!
        // draggableId is the Task ID. destination.droppableId is the new Status.
        updateStatus.mutate({
            taskId: draggableId,
            status: destination.droppableId as "TODO" | "IN_PROGRESS" | "DONE"
        });
    };

    if (isLoading) return <div className="animate-pulse text-slate-500">Loading Kanban...</div>;

    return (
        <div className="space-y-6">
            {/* Rapid-Fire Creation Form */}
            <form
                onSubmit={(e) => { e.preventDefault(); createTask.mutate({ title, projectId }); }}
                className="mb-6 flex gap-4"
            >
                <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 rounded-md border p-2 text-sm"
                />
                <Button type="submit" disabled={!title.trim() || createTask.isPending}>Add Task</Button>
            </form>

            {/* THE KANBAN BOARD */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {COLUMNS.map((colStatus) => {
                        // Bucket the tasks into their specific columns
                        const columnTasks = tasks?.filter((t) => t.status === colStatus) ?? [];

                        return (
                            <Droppable key={colStatus} droppableId={colStatus}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex min-h-[300px] flex-col rounded-xl bg-slate-100 p-4 transition-colors ${snapshot.isDraggingOver ? "bg-slate-200 ring-2 ring-slate-300" : ""
                                            }`}
                                    >
                                        <h3 className="mb-4 text-sm font-bold tracking-widest text-slate-500">
                                            {colStatus.replace("_", " ")} ({columnTasks.length})
                                        </h3>

                                        <div className="flex flex-col gap-3">
                                            {columnTasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`group relative flex flex-col justify-between rounded-lg border bg-white p-4 shadow-sm transition-shadow ${snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500" : "hover:border-slate-300"
                                                                }`}
                                                        >
                                                            <p className={`font-medium ${task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                                                {task.title}
                                                            </p>

                                                            {/* Hover Delete Button */}
                                                            <button
                                                                onClick={() => deleteTask.mutate({ taskId: task.id })}
                                                                className="absolute right-2 top-2 hidden text-slate-400 hover:text-red-500 group-hover:block"
                                                                title="Delete task"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}