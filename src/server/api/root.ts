import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { projectRouter } from "~/server/api/routers/project";
import { taskRouter } from "~/server/api/routers/task";

/**
 * This is the primary router for our server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

/**
 * The Kitchen Manager
 * This allows Server Components to securely call tRPC procedures directly.
 */
export const createCaller = createCallerFactory(appRouter);