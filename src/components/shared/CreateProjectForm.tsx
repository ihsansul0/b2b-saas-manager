"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export function CreateProjectForm() {
    const [name, setName] = useState("");
    const router = useRouter();

    // THE WAITER: This connects directly to the trpc mutation
    const createProject = api.project.create.useMutation({
        onSuccess: () => {
            // When the database successfully saves the project:
            setName(""); // Clear the input field
            router.refresh(); // Tell the Next.js Server to re-fetch the table data!
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                // Hand the order to the Waiter. Zod will check it instantly.
                createProject.mutate({ name });
            }}
            className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border"
        >
            <input
                type="text"
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-md border p-2 text-sm"
                disabled={createProject.isPending}
            />
            <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>

            {/* If Zod or the backend throws an error, show it here */}
            {/* Look for the specific Zod field error first! */}
            {createProject.error && (
                <p className="text-sm text-red-500">{createProject.error.data?.zodError?.fieldErrors?.name?.[0] ?? createProject.error.message}</p>
            )}
        </form>
    );
}