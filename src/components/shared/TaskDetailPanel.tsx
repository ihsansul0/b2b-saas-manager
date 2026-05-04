"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import Pusher from "pusher-js";
import { useUser } from "@clerk/nextjs";

type TaskProps = {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
};

export function TaskDetailPanel({ task, onClose }: { task: TaskProps; onClose: () => void }) {
    // Task Details State
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? "");
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");

    // Chat State
    const [newComment, setNewComment] = useState("");

    const utils = api.useUtils();

    // We need to know who WE are, so we don't listen to our own echoes!
    const { user } = useUser();

    // THE LIVE WIRE (WebSockets Listener)
    useEffect(() => {
        // 1. Turn on the radio
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        // 2. Tune into this specific Task's frequency
        const channel = pusher.subscribe(`task-${task.id}`);

        // 3. When we hear "new-comment"...
        channel.bind("new-comment", (data: { triggeredBy: string }) => {
            // THE OPTIMISTIC UI TRICK:
            // If WE sent the comment, our tRPC mutation already instantly updated our screen.
            // We only want to trigger a refresh if SOMEONE ELSE sent a message!
            if (data.triggeredBy !== user?.id) {
                void utils.task.getComments.invalidate({ taskId: task.id });
            }
        });

        // 4. Turn off the radio when we close the panel (Memory Management!)
        return () => {
            pusher.unsubscribe(`task-${task.id}`);
        };
    }, [task.id, user?.id, utils]);

    // 1. Task Details Mutation
    const updateDetails = api.task.updateDetails.useMutation({
        onSuccess: () => {
            void utils.task.getByProjectId.invalidate();
            onClose();
        }
    });

    // 2. Fetch the Chat History
    const { data: comments, isLoading: loadingComments } = api.task.getComments.useQuery({ taskId: task.id });

    // 3. Send a Message
    const addComment = api.task.addComment.useMutation({
        onSuccess: () => {
            setNewComment(""); // Clear the input box instantly
            void utils.task.getComments.invalidate({ taskId: task.id }); // Tell the Waiter to grab the new message
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition-opacity">
            <div className="flex h-full w-full max-w-md animate-in slide-in-from-right-full flex-col bg-white shadow-2xl sm:border-l">

                {/* TOP HALF: TASK DETAILS (Scrollable)        */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full resize-none border-none bg-transparent p-0 text-xl font-extrabold text-slate-900 focus:outline-none focus:ring-0"
                            rows={2}
                        />
                        <button onClick={onClose} className="mt-1 text-slate-400 font-bold hover:text-slate-600">
                            ✕
                        </button>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold uppercase tracking-tight text-slate-500">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold uppercase tracking-tight text-slate-500">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add more details to this task..."
                                className="min-h-[150px] resize-y rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mt-2 flex justify-end gap-3">
                            <Button
                                disabled={updateDetails.isPending || !title.trim()}
                                onClick={() => updateDetails.mutate({
                                    taskId: task.id, title, description, dueDate: dueDate ? new Date(dueDate) : null
                                })}
                            >
                                {updateDetails.isPending ? "Saving..." : "Save Details"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* BOTTOM HALF: COLLABORATION HUB (Chat)      */}
                <div className="flex h-[350px] flex-col border-t bg-slate-50 p-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-tight text-slate-500">Activity & Comments</h3>

                    {/* The Chat Feed */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {loadingComments ? (
                            <p className="text-sm text-slate-400">Loading history...</p>
                        ) : comments?.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No comments yet. Be the first to start the conversation!</p>
                        ) : (
                            comments?.map((comment) => (
                                <div key={comment.id} className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900">{comment.user.name ?? "Unknown User"}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* The Input Box */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (newComment.trim()) addComment.mutate({ taskId: task.id, content: newComment });
                        }}
                        className="mt-4 flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                            type="submit"
                            disabled={!newComment.trim() || addComment.isPending}
                            className="rounded-full px-6"
                        >
                            Send
                        </Button>
                    </form>
                </div>

            </div>
        </div>
    );
}