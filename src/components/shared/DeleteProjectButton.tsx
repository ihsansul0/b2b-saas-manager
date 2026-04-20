"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
    const router = useRouter();

    const deleteProject = api.project.delete.useMutation({
        onSuccess: () => {
            // When the server successfully deletes the project, kick the user back to the dashboard
            router.push("/dashboard");
            router.refresh();
        },
    });

    return (
        <Button
            variant="destructive"
            disabled={deleteProject.isPending}
            onClick={() => {
                // Always ask for confirmation before destroying data!
                if (window.confirm("Are you sure you want to delete this project and all its tasks? This cannot be undone.")) {
                    deleteProject.mutate({ id: projectId });
                }
            }}
        >
            {deleteProject.isPending ? "Deleting..." : "Delete Project"}
        </Button>
    );
}