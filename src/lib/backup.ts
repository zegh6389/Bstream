import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logAuditEvent, AuditAction } from "./audit";
import { compressData, decompressData } from "./compression";

// Use the standard AWS provider chain for credentials and configuration
const s3Client = new S3Client({
  region: "ca-central-1",
});

const BUCKET_NAME = "bstream374";

export interface BackupMetadata {
  version: string;
  timestamp: string;
  type: "full" | "incremental";
  format: "json" | "csv" | "excel";
  tables: string[];
  isArchived?: boolean;
  archiveDate?: string;
}

export async function createBackup(
  prisma: PrismaClient,
  type: "full" | "incremental" = "full"
) {
  const tables = [
    "user", "account", "session", "business", "category",
    "transaction", "verificationToken", "resetToken", "auditLog",
  ];

  const data: Record<string, any[]> = {};
  for (const table of tables) {
    data[table] = await prisma[table].findMany();
  }

  const metadata: BackupMetadata = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    type,
    format: "json",
    tables,
    isArchived: false
  };

  try {
    const backupData = { metadata, data };
    const backupFileName = `backup-${metadata.timestamp}-${type}.json.gz`;

    // Compress the backup data
    const compressedData = await compressData(JSON.stringify(backupData));

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: backupFileName,
        Body: compressedData,
        ContentType: "application/gzip",
        ContentEncoding: "gzip",
        ServerSideEncryption: "AES256",
        Metadata: {
          "backup-type": type,
          "backup-version": metadata.version,
          "backup-tables": tables.join(","),
        },
      })
    );

    await logAuditEvent(
      prisma, 
      AuditAction.BACKUP, 
      "database", 
      backupFileName, 
      { 
        type, 
        tables,
        size: compressedData.length,
        originalSize: JSON.stringify(backupData).length
      }
    );

    return { 
      success: true,
      fileName: backupFileName, 
      metadata,
      size: compressedData.length
    };
  } catch (error) {
    console.error("Failed to create backup:", error);
    await logAuditEvent(
      prisma,
      AuditAction.BACKUP,
      "database",
      "failed",
      { error: error instanceof Error ? error.message : String(error) }
    );
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function restoreBackup(
  prisma: PrismaClient,
  fileName: string
) {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      })
    );

    if (!response.Body) {
      throw new Error("Backup file is empty");
    }

    const compressed = await response.Body.transformToByteArray();
    const decompressed = await decompressData(Buffer.from(compressed));
    const backup = JSON.parse(decompressed);

    await prisma.$transaction(async (tx) => {
      for (const table of backup.metadata.tables.reverse()) { // Delete in reverse order
          await tx[table].deleteMany();
      }
      for (const table of backup.metadata.tables) { // Create in original order
        if (Array.isArray(backup.data[table]) && backup.data[table].length > 0) {
          await tx[table].createMany({
            data: backup.data[table],
            skipDuplicates: true,
          });
        }
      }
    });

    await logAuditEvent(
      prisma, 
      AuditAction.RESTORE, 
      "database", 
      fileName, 
      { 
        tables: backup.metadata.tables,
        recordsRestored: Object.values(backup.data)
          .reduce((acc: number, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0)
      }
    );

    return {
      success: true,
      metadata: backup.metadata,
      tablesRestored: backup.metadata.tables,
    };
  } catch (error) {
    console.error("Failed to restore backup:", error);
    await logAuditEvent(
      prisma,
      AuditAction.RESTORE,
      "database",
      fileName,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// NEW FUNCTION: List all available backups
export async function listBackups() {
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: "backup-",
        });

        const response = await s3Client.send(listCommand);
        const backups = response.Contents
            ?.map(obj => ({
                key: obj.Key,
                lastModified: obj.LastModified,
                size: obj.Size,
            }))
            .sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
        
        return { success: true, backups };
    } catch (error) {
        console.error("Failed to list backups:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// NEW FUNCTION: Get a temporary, secure URL to download a backup file
export async function getPresignedUrlForBackup(key: string) {
    try {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // URL is valid for 1 hour
        return { success: true, url };
    } catch (error) {
        console.error("Failed to generate presigned URL:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}