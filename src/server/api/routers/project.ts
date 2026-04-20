import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { projects, workspaces, tasks } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
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

    // THE DEMOLITION PROTOCOL
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // STEP 1: Delete all tasks inside the project first!
            await ctx.db.delete(tasks).where(
                and(
                    eq(tasks.projectId, input.id),
                    eq(tasks.workspaceId, ctx.workspaceId) // Security Anchor: Never delete another company's tasks!
                )
            );

            // STEP 2: Now that the project is empty, delete the project itself.
            await ctx.db.delete(projects).where(
                and(
                    eq(projects.id, input.id),
                    eq(projects.workspaceId, ctx.workspaceId) // Security Anchor
                )
            );

            return { success: true };
        }),

    // THE UPDATE PROTOCOL (Rename Project)
    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(3, "Project name must be at least 3 characters")
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(projects)
                .set({ name: input.name })
                .where(
                    and(
                        eq(projects.id, input.id),
                        eq(projects.workspaceId, ctx.workspaceId) // Security Anchor: No renaming other people's projects!
                    )
                );

            return { success: true };
        }),
});