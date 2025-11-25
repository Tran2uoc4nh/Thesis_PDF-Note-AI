// File: convex/documents.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const saveDocument = internalMutation({
    args: {
        type: v.string(),
        text: v.string(),
        embedding: v.array(v.float64()),
        metadata: v.any(),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("documents", {
            type: args.type,
            text: args.text,
            embedding: args.embedding,
            metadata: args.metadata,
            imageUrl: args.imageUrl,
        });
    },
});