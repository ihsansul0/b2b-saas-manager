import Link from "next/link";
import { api } from "~/trpc/server";
import { CreateProjectForm } from "~/components/shared/CreateProjectForm";
import { UserButton, OrganizationSwitcher, CreateOrganization } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
    // 1. We securely ask the Bouncer for the user's current state
    const { orgId } = await auth();

    // 2. THE CHECKPOINT: If they don't have an active kitchen, force them to make one!
    if (!orgId) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 text-slate-900">
                <h1 className="mb-6 text-2xl font-bold tracking-tight">Welcome! Let's set up your first workspace.</h1>
                <div className="rounded-xl border bg-white p-8 shadow-sm">
                    {/* Clerk's pre-built component handles all the complex workspace creation logic */}
                    <CreateOrganization />
                </div>
            </main>
        );
    }

    // 3. THE SAFE ZONE: If they reach here, orgId is guaranteed to exist. We can safely fetch data.
    const projects = await api.project.getAll();

    return (
        <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
            <nav className="mb-12 flex items-center justify-between border-b pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
                <div className="flex items-center gap-4">
                    <OrganizationSwitcher hidePersonal={true} />
                    <UserButton />
                </div>
            </nav>

            <div className="mx-auto max-w-3xl">
                <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Start a New Project</h2>
                    <CreateProjectForm />
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Active Projects</h2>
                    {projects.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                            No projects found in this workspace. Create one above!
                        </div>
                    ) : (
                        <ul className="grid gap-4">
                            {projects.map((project) => (
                                <li key={project.id} className="group rounded-lg border bg-white shadow-sm transition-all hover:border-slate-400 hover:shadow-md">
                                    <Link href={`/dashboard/projects/${project.id}`} className="flex items-center justify-between p-4">
                                        <span className="font-medium group-hover:text-blue-600 transition-colors">{project.name}</span>
                                        <span className="text-xs text-slate-500">
                                            Created {project.createdAt.toLocaleDateString()}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </main>
    );
}