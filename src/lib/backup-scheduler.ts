import { PrismaClient } from "@prisma/client";
import { createBackup } from "./backup";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { logAuditEvent, AuditAction } from "./audit";

const s3Client = new S3Client({
    region: "ca-central-1",
});

const BUCKET_NAME = "bstream374";

interface RetentionPolicy {
    maxBackups?: number;
    maxAgeInDays?: number;
    keepMinimumBackups?: number;
}

export async function scheduleBackup(
    prisma: PrismaClient,
    options: {
        type?: "full" | "incremental";
        retention?: RetentionPolicy;
    } = {}
) {
    const { type = "incremental", retention } = options;

    try {
        // Create new backup
        const backup = await createBackup(prisma, type);
        if (!backup.success) {
            throw new Error(backup.error);
        }

        // Apply retention policy if specified
        if (retention) {
            await cleanupOldBackups(prisma, retention);
        }

        return backup;
    } catch (error) {
        console.error("Scheduled backup failed:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

export async function cleanupOldBackups(
    prisma: PrismaClient,
    policy: RetentionPolicy
) {
    try {
        const { maxBackups = 30, maxAgeInDays = 90, keepMinimumBackups = 5 } = policy;

        // List all backups
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: "backup-",
        });

        const response = await s3Client.send(listCommand);
        if (!response.Contents) {
            return { success: true, deletedCount: 0 };
        }

        // Sort backups by date
        const backups = response.Contents
            .filter(obj => obj.Key?.startsWith("backup-"))
            .sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0));

        // Keep minimum number of backups
        if (backups.length <= keepMinimumBackups) {
            return { success: true, deletedCount: 0 };
        }

        const now = new Date();
        const deletedFiles: string[] = [];

        // Process each backup based on retention policy
        for (let i = 0; i < backups.length; i++) {
            const backup = backups[i];
            if (!backup.Key || !backup.LastModified) continue;

            // Always keep minimum number of backups
            if (i < keepMinimumBackups) continue;

            // Check age
            const ageInDays = (now.getTime() - backup.LastModified.getTime()) / (1000 * 60 * 60 * 24);
            
            // Delete if:
            // 1. Exceeds max backups limit, or
            // 2. Exceeds max age
            if (i >= maxBackups || ageInDays > maxAgeInDays) {
                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: backup.Key,
                    })
                );
                deletedFiles.push(backup.Key);
            }
        }

        if (deletedFiles.length > 0) {
            await logAuditEvent(
                prisma,
                AuditAction.DELETE,
                "backup",
                "cleanup",
                {
                    deletedFiles,
                    policy
                }
            );
        }

        return { 
            success: true, 
            deletedCount: deletedFiles.length,
            deletedFiles
        };
    } catch (error) {
        console.error("Backup cleanup failed:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

export async function calculateBackupStats() {
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: "backup-",
        });

        const response = await s3Client.send(listCommand);
        if (!response.Contents) {
            return { 
                success: true, 
                stats: {
                    totalBackups: 0,
                    totalSize: 0,
                    averageSize: 0,
                    oldestBackup: null,
                    newestBackup: null,
                }
            };
        }

        const backups = response.Contents
            .filter(obj => obj.Key?.startsWith("backup-"))
            .sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0));

        const stats = {
            totalBackups: backups.length,
            totalSize: backups.reduce((acc, curr) => acc + (curr.Size ?? 0), 0),
            averageSize: Math.round(
                backups.reduce((acc, curr) => acc + (curr.Size ?? 0), 0) / backups.length
            ),
            oldestBackup: backups[backups.length - 1]?.LastModified ?? null,
            newestBackup: backups[0]?.LastModified ?? null,
        };

        return { success: true, stats };
    } catch (error) {
        console.error("Failed to calculate backup stats:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}
