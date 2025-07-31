import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { logAuditEvent, AuditAction } from "./audit";

const s3Client = new S3Client({
  region: "ca-central-1",
});

const BUCKET_NAME = "bstream374";
const ARCHIVE_PREFIX = "archive/";

export async function archiveData(
  prisma: PrismaClient,
  table: string,
  filter: Record<string, any>,
  options: {
    deleteAfterArchive?: boolean;
    description?: string;
  } = {}
) {
  const { deleteAfterArchive = false, description = "" } = options;

  try {
    // Fetch data to archive
    // @ts-ignore - Dynamic table access
    const data = await prisma[table].findMany({
      where: filter,
    });

    if (data.length === 0) {
      return { success: false, error: "No data found to archive" };
    }

    // Create archive metadata
    const archiveMetadata = {
      table,
      timestamp: new Date().toISOString(),
      filter,
      recordCount: data.length,
      description,
    };

    // Generate archive file name
    const archiveFileName = `${ARCHIVE_PREFIX}${table}-${archiveMetadata.timestamp}.json`;

    // Upload archive to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: archiveFileName,
        Body: JSON.stringify({ metadata: archiveMetadata, data }),
        ContentType: "application/json",
        ServerSideEncryption: "AES256",
        Metadata: {
          archived: "true",
          table,
          timestamp: archiveMetadata.timestamp,
        },
      })
    );

    // Delete archived data if requested
    if (deleteAfterArchive) {
      // @ts-ignore - Dynamic table access
      await prisma[table].deleteMany({
        where: filter,
      });
    }

    // Log the archive operation
    await logAuditEvent(
      prisma,
      AuditAction.ARCHIVE,
      table,
      archiveFileName,
      {
        filter,
        recordCount: data.length,
        deleteAfterArchive,
        description,
      }
    );

    return {
      success: true,
      archiveFileName,
      recordCount: data.length,
    };
  } catch (error) {
    console.error("Failed to archive data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function restoreFromArchive(
  prisma: PrismaClient,
  archiveFileName: string,
  options: {
    deleteArchiveAfterRestore?: boolean;
  } = {}
) {
  const { deleteArchiveAfterRestore = false } = options;

  try {
    // Fetch archive from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: archiveFileName,
      })
    );

    const archiveContent = await response.Body?.transformToString();
    if (!archiveContent) {
      throw new Error("Archive file is empty");
    }

    const { metadata, data } = JSON.parse(archiveContent);

    // Restore data to the database
    // @ts-ignore - Dynamic table access
    await prisma[metadata.table].createMany({
      data,
      skipDuplicates: true,
    });

    // Delete archive file if requested
    if (deleteArchiveAfterRestore) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: archiveFileName,
        })
      );
    }

    // Log the restore operation
    await logAuditEvent(
      prisma,
      AuditAction.RESTORE,
      metadata.table,
      archiveFileName,
      {
        recordCount: data.length,
        deleteArchiveAfterRestore,
      }
    );

    return {
      success: true,
      table: metadata.table,
      recordCount: data.length,
    };
  } catch (error) {
    console.error("Failed to restore from archive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function listArchives(table?: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: ARCHIVE_PREFIX + (table ? `${table}-` : ""),
    });

    const response = await s3Client.send(command);
    const archives = response.Contents
      ?.filter(obj => obj.Key?.startsWith(ARCHIVE_PREFIX))
      .map(obj => ({
        key: obj.Key,
        table: obj.Key?.split("-")[0].replace(ARCHIVE_PREFIX, ""),
        timestamp: obj.LastModified,
        size: obj.Size,
      }))
      .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));

    return { success: true, archives };
  } catch (error) {
    console.error("Failed to list archives:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
