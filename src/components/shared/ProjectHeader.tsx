"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export function ProjectHeader({ projectId, initialName }: { projectId: string; initialName: string }) {
    // We use React State to track if we are in "Reading" mode or "Editing" mode
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);

    const router = useRouter();

    const updateProject = api.project.update.useMutation({
        onSuccess: () => {
            setIsEditing(false); // Turn off edit mode
            router.refresh(); // Silently tell Next.js to fetch the new name from the database
        }
    });

    // IF WE ARE IN EDIT MODE: Show the input field and buttons
    if (isEditing) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-md border p-1 text-2xl font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-400"
                        autoFocus
                    />
                    <Button
                        size="sm"
                        onClick={() => updateProject.mutate({ id: projectId, name })}
                        disabled={updateProject.isPending}
                    >
                        {updateProject.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setName(initialName); // Reset the typo
                            setIsEditing(false); // Close the input
                        }}
                    >
                        Cancel
                    </Button>
                </div>

                {/* The Waiter's error message, parsed nicely! */}
                {updateProject.error && (
                    <p className="text-sm font-medium text-red-500">
                        {updateProject.error.data?.zodError?.fieldErrors?.name?.[0] ?? updateProject.error.message}
                    </p>
                )}
            </div>
        );
    }

    // IF WE ARE IN READING MODE: Just show the title, but make it clickable
    return (
        <h1
            className="cursor-pointer text-3xl font-extrabold tracking-tight transition-colors hover:text-slate-500"
            onClick={() => setIsEditing(true)}
            title="Click to edit project name"
        >
            {initialName}
        </h1>
    );
}