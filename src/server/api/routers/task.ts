import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tasks } from "~/server/db/schema";

export const taskRouter = createTRPCRouter({

    // 1. THE READ: Fetch tasks for ONE specific project
    getByProjectId: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.tasks.findMany({
                where: (tasks, { eq, and }) => and(
                    // Rule 1: It must belong to the requested project
                    eq(tasks.projectId, input.projectId),
                    // Rule 2 (SECURITY): It MUST belong to the user's active workspace
                    eq(tasks.workspaceId, ctx.workspaceId)
                ),
                orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
            });
        }),

    // 2. THE WRITE: Create a new task
    create: protectedProcedure
        .input(z.object({
            title: z.string().min(3, "Task title must be at least 3 characters"),
            projectId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const newId = crypto.randomUUID();

            await ctx.db.insert(tasks).values({
                id: newId,
                title: input.title,
                projectId: input.projectId,
                workspaceId: ctx.workspaceId, // Security Anchor
            });

            return { id: newId };
        }),

    // 3. THE STATUS UPDATE: Move a task across the Kanban board
    updateStatus: protectedProcedure
        .input(z.object({
            taskId: z.string(),
            status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(tasks)
                .set({ status: input.status })
                .where(
                    and(
                        // Find the exact task
                        eq(tasks.id, input.taskId),
                        // Security Anchor: NEVER let someone update a task outside their workspace!
                        eq(tasks.workspaceId, ctx.workspaceId)
                    )
                );
        }),

    // THE UPDATE PROTOCOL (Rename Task)
    update: protectedProcedure
        .input(z.object({
            taskId: z.string(),
            title: z.string().min(3, "Task title must be at least 3 characters")
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(tasks)
                .set({ title: input.title })
                .where(
                    and(
                        eq(tasks.id, input.taskId),
                        eq(tasks.workspaceId, ctx.workspaceId) // Security Anchor
                    )
                );

            return { success: true };
        }),

    // THE DEMOLITION PROTOCOL (Delete Task)
    delete: protectedProcedure
        .input(z.object({ taskId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(tasks)
                .where(
                    and(
                        eq(tasks.id, input.taskId),
                        eq(tasks.workspaceId, ctx.workspaceId) // Security Anchor
                    )
                );

            return { success: true };
        }),
});