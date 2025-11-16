import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
    users: defineTable({
        userName: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        upgrade: v.boolean()
    }),
    pdfFiles: defineTable({
        fileId: v.string(),
        storageId: v.string(),
        fileName: v.string(),
        fileUrl: v.string(),
        thumbnailStorageId: v.optional(v.string()),  // Thêm dòng này
        thumbnailUrl: v.optional(v.string()),
        createdBy: v.string()
    }),
    documents: defineTable({
        embedding: v.array(v.number()),
        text: v.string(),
        metadata: v.any(),
        // --- CÁC TRƯỜNG MỚI ---
        type: v.string(), // "text" hoặc "image"
        imageUrl: v.optional(v.string()) // URL của ảnh gốc (nếu type là "image")
        // --- HẾT TRƯỜNG MỚI ---
    }).vectorIndex("byEmbedding", {
        vectorField: "embedding",
        dimensions: 3072,
        filterFields: ["metadata.fileId"]
    }),
    notes: defineTable({
        fileId: v.string(),
        notes: v.any(),
        createdBy: v.string()
    })
})