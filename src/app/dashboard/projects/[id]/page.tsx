import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { TaskBoard } from "~/components/shared/TaskBoard";
import Link from "next/link";
import { Button } from "~/components/ui/button";

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

                    <h1 className="mb-8 text-3xl font-extrabold tracking-tight">{project.name}</h1>

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