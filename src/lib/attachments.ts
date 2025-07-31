import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "crypto";
import { logAuditEvent, AuditAction } from "./audit";
import { PrismaClient } from "@prisma/client";

const s3Client = new S3Client({
    region: "ca-central-1",
});

const BUCKET_NAME = "bstream374";
const ATTACHMENTS_PREFIX = "attachments/";

// Supported file types and their size limits
const FILE_TYPE_LIMITS = {
    // Images
    'image/jpeg': 5 * 1024 * 1024, // 5MB
    'image/png': 5 * 1024 * 1024,
    'image/webp': 5 * 1024 * 1024,
    // Documents
    'application/pdf': 10 * 1024 * 1024, // 10MB
    'application/msword': 10 * 1024 * 1024,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024,
    // Spreadsheets
    'application/vnd.ms-excel': 10 * 1024 * 1024,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024,
    // Text
    'text/plain': 1 * 1024 * 1024, // 1MB
    'text/csv': 5 * 1024 * 1024,
} as const;

type SupportedMimeType = keyof typeof FILE_TYPE_LIMITS;

interface UploadOptions {
    contentType: SupportedMimeType;
    fileName: string;
    description?: string;
    tags?: Record<string, string>;
    entityType?: string;
    entityId?: string;
}

export async function createUploadUrl(
    prisma: PrismaClient,
    options: UploadOptions
) {
    try {
        // Validate content type
        if (!Object.keys(FILE_TYPE_LIMITS).includes(options.contentType)) {
            return {
                success: false,
                error: "Unsupported file type"
            };
        }

        // Generate a unique file key
        const fileHash = createHash('sha256')
            .update(`${options.fileName}-${Date.now()}`)
            .digest('hex')
            .slice(0, 12);
        
        const key = `${ATTACHMENTS_PREFIX}${fileHash}-${options.fileName}`;

        // Create presigned URL for upload
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: options.contentType,
            Metadata: {
                fileName: options.fileName,
                description: options.description || '',
                ...options.tags,
            },
        });

        const uploadUrl = await getSignedUrl(s3Client, putCommand, {
            expiresIn: 3600, // 1 hour
        });

        // Create attachment record
        await prisma.attachment.create({
            data: {
                key,
                fileName: options.fileName,
                contentType: options.contentType,
                description: options.description,
                entityType: options.entityType,
                entityId: options.entityId,
                metadata: options.tags,
                status: 'pending',
            },
        });

        return {
            success: true,
            key,
            uploadUrl,
            expiresIn: 3600,
        };
    } catch (error) {
        console.error("Failed to create upload URL:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function finalizeAttachment(
    prisma: PrismaClient,
    key: string,
    userId: string,
) {
    try {
        // Verify the file exists in S3
        const headCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(headCommand);

        // Update attachment status
        const attachment = await prisma.attachment.update({
            where: { key },
            data: { status: 'active' },
        });

        await logAuditEvent(
            prisma,
            AuditAction.CREATE,
            'attachment',
            key,
            {
                userId,
                fileName: attachment.fileName,
                entityType: attachment.entityType,
                entityId: attachment.entityId,
            }
        );

        return { success: true, attachment };
    } catch (error) {
        console.error("Failed to finalize attachment:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function getAttachmentUrl(
    prisma: PrismaClient,
    key: string,
    userId: string,
) {
    try {
        // Verify attachment exists and is active
        const attachment = await prisma.attachment.findUnique({
            where: { key },
        });

        if (!attachment || attachment.status !== 'active') {
            throw new Error("Attachment not found or not active");
        }

        // Generate download URL
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const downloadUrl = await getSignedUrl(s3Client, getCommand, {
            expiresIn: 3600, // 1 hour
        });

        // Log access
        await logAuditEvent(
            prisma,
            AuditAction.ACCESS,
            'attachment',
            key,
            { userId }
        );

        return {
            success: true,
            url: downloadUrl,
            attachment,
        };
    } catch (error) {
        console.error("Failed to get attachment URL:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function deleteAttachment(
    prisma: PrismaClient,
    key: string,
    userId: string,
) {
    try {
        // Delete from S3
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            })
        );

        // Update database
        await prisma.attachment.update({
            where: { key },
            data: { status: 'deleted' },
        });

        // Log deletion
        await logAuditEvent(
            prisma,
            AuditAction.DELETE,
            'attachment',
            key,
            { userId }
        );

        return { success: true };
    } catch (error) {
        console.error("Failed to delete attachment:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function listAttachments(
    prisma: PrismaClient,
    options: {
        entityType?: string;
        entityId?: string;
        status?: 'pending' | 'active' | 'deleted';
    } = {}
) {
    try {
        const attachments = await prisma.attachment.findMany({
            where: {
                entityType: options.entityType,
                entityId: options.entityId,
                status: options.status ?? 'active',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { success: true, attachments };
    } catch (error) {
        console.error("Failed to list attachments:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
