import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const AddFileEntryToDb = mutation({
    args: {
        filedId: v.string(),
        storageId: v.string(),
        fileName: v.string(),
        createdBy: v.string(),
        fileUrl: v.string()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('pdfFiles', {
            fileId: args.filedId,
            storageId: args.storageId,
            fileName: args.fileName,
            fileUrl: args.fileUrl,
            createdBy: args.createdBy
        })
        return 'Inserted'
    }
})

export const getFileUrl = mutation({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId)
        return url
    }
})

export const GetFileRecord = query({
    args: {
        fileId: v.string(),
    },
    handler: async (ctx, args) => {
        const file = await ctx.db.query('pdfFiles').filter((q) => q.eq(q.field('fileId'), args.fileId)).collect();
        return file[0]
    }
})

export const GetUserFiles = query({
    args: {
        userEmail: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        if (!args?.userEmail) {
            return
        }
        const result = await ctx.db.query('pdfFiles').filter((q) => q.eq(q.field('createdBy'), args.userEmail)).order('desc').collect();
        return result
    }
})

export const DeleteFile = mutation({
    args: {
        fileId: v.string(),
    },
    handler: async (ctx, args) => {
        // Tìm file trong database
        const file = await ctx.db.query('pdfFiles')
            .filter((q) => q.eq(q.field('fileId'), args.fileId))
            .collect();

        if (file.length > 0) {
            // Xóa file từ storage
            await ctx.storage.delete(file[0].storageId);

            // Xóa record trong database
            await ctx.db.delete(file[0]._id);

            return 'File deleted successfully';
        }
        return 'File not found';
    }
})
