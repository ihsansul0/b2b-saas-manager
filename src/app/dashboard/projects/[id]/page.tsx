import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { TaskBoard } from "~/components/shared/TaskBoard";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { DeleteProjectButton } from "~/components/shared/DeleteProjectButton";
import { ProjectHeader } from "~/components/shared/ProjectHeader";
import { ProjectAnalytics } from "~/components/shared/ProjectAnalytics";

export default async function ProjectPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    // In Next.js 15, dynamic route params must be awaited!
    const { id } = await params;

    try {
        // We securely ask the backend for the project details
        const project = await api.project.getById({ id });

        return (
            <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
                <div className="mx-auto max-w-3xl">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="mb-8 -ml-4 text-slate-500">
                            ← Back to Dashboard
                        </Button>
                    </Link>

                    {/* Flexbox to push the title left and the delete button right */}
                    <div className="mb-8 flex items-center justify-between">
                        <ProjectHeader projectId={project.id} initialName={project.name} />
                        <DeleteProjectButton projectId={project.id} />
                    </div>
                    
                    <ProjectAnalytics projectId={project.id} />

                    {/* We pass the verified ID into our Client Component */}
                    <TaskBoard projectId={project.id} />
                </div>
            </main>
        );
    } catch {
        // If the project doesn't exist or doesn't belong to the user, throw a 404
        notFound();
    }
}