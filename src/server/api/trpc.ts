import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 * This is the clipboard our waiter carries. It is created for every single incoming request.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // We securely ask Clerk: "Who is making this request right now?"
  const session = await auth();

  return {
    db,
    userId: session.userId,
    workspaceId: session.orgId, // Clerk's Organization ID is our Workspace ID
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 * Setting up tRPC with our secure context and SuperJSON (for handling Dates automatically).
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

/**
 * 3. PROCEDURES (The Rules of the Restaurant)
 */

// Public Procedure: Anyone can use this (e.g., fetching a public landing page stat)
export const publicProcedure = t.procedure;

// Protected Procedure: The user MUST be logged in AND belong to a Workspace.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
  }

  if (!ctx.workspaceId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You must select an active workspace." });
  }

  // If they pass the checks, we let the request continue and guarantee the IDs exist
  return next({
    ctx: {
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });
});