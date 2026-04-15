import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { projects } from "~/server/db/schema";

export const projectRouter = createTRPCRouter({

    // 1. THE READ: Fetching all projects securely
    getAll: protectedProcedure.query(async ({ ctx }) => {
        // We strictly query only the projects matching the active workspace clipboard ID
        return ctx.db.query.projects.findMany({
            where: (projects, { eq }) => eq(projects.workspaceId, ctx.workspaceId),
            orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        });
    }),

    // 2. THE WRITE: Creating a new project
    create: protectedProcedure
        // THE STRICT FORM: Zod validates the incoming data before the mutation runs
        .input(z.object({
            name: z.string().min(3, "Project name must be at least 3 characters")
        }))
        .mutation(async ({ ctx, input }) => {
            const newId = crypto.randomUUID();

            await ctx.db.insert(projects).values({
                id: newId,
                name: input.name,
                // The Tenant ID Pattern in Action: We pull the workspaceId directly from the server context, NEVER from the user's frontend input.
                workspaceId: ctx.workspaceId,
            });

            return { id: newId };
        }),
});