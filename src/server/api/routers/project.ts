import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { projects, workspaces } from "~/server/db/schema";
// 1. Import the Bouncer's internal radio (clerkClient)
import { clerkClient } from "@clerk/nextjs/server";

export const projectRouter = createTRPCRouter({

    getAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.projects.findMany({
            where: (projects, { eq }) => eq(projects.workspaceId, ctx.workspaceId),
            orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        });
    }),

    // FETCH A SINGLE PROJECT SECURELY
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.query.projects.findFirst({
                where: (projects, { eq, and }) => and(
                    eq(projects.id, input.id),
                    eq(projects.workspaceId, ctx.workspaceId) // Security Anchor!
                ),
            });

            // If the project doesn't exist (or the hacker doesn't own it), throw an error
            if (!project) {
                throw new Error("Project not found");
            }

            return project;
        }),

    create: protectedProcedure
        .input(z.object({
            name: z.string().min(3, "Project name must be at least 3 characters")
        }))
        .mutation(async ({ ctx, input }) => {

            // THE FIX: JUST-IN-TIME (JIT) SYNC
            // 1. Grab the Clerk Client to talk to the Bouncer's backend
            const clerk = await clerkClient();

            // 2. Ask the Bouncer for the details of the current kitchen
            const organization = await clerk.organizations.getOrganization({
                organizationId: ctx.workspaceId,
            });

            // 3. Tell Neon about the kitchen. 
            // "onConflictDoNothing" is Drizzle magic: If the kitchen already exists, skip this safely!
            await ctx.db.insert(workspaces).values({
                id: ctx.workspaceId,
                name: organization.name,
            }).onConflictDoNothing();

            // THE ORIGINAL PROJECT INSERT
            const newId = crypto.randomUUID();

            await ctx.db.insert(projects).values({
                id: newId,
                name: input.name,
                workspaceId: ctx.workspaceId,
            });

            return { id: newId };
        }),
});