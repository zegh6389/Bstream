import { PrismaClient } from "@prisma/client";
import * as XLSX from 'xlsx';
import { createObjectCsvStringifier } from 'csv-writer';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { logAuditEvent, AuditAction } from "./audit";

const s3Client = new S3Client({
  region: "ca-central-1",
});

const BUCKET_NAME = "bstream374";

export async function exportTableToFormat(
  prisma: PrismaClient,
  table: string,
  format: "csv" | "excel",
  filter?: Record<string, any>
) {
  try {
    const data = await prisma[table].findMany({ where: filter });
    
    let exportedData: Buffer | string;
    let contentType: string;
    let extension: string;

    if (format === "csv") {
      const csvStringifier = createObjectCsvStringifier({
        header: Object.keys(data[0] || {}).map(key => ({ id: key, title: key }))
      });

      exportedData = csvStringifier.getHeaderString() +
        csvStringifier.stringifyRecords(data);
      contentType = "text/csv";
      extension = "csv";
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, table);
      exportedData = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      extension = "xlsx";
    }

    const fileName = `export-${table}-${new Date().toISOString()}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: exportedData,
        ContentType: contentType,
        ServerSideEncryption: "AES256",
      })
    );

    await logAuditEvent(
      prisma,
      AuditAction.EXPORT,
      table,
      fileName,
      { format, filter }
    );

    return { success: true, fileName };
  } catch (error) {
    console.error(`Failed to export ${table}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function bulkImport(
  prisma: PrismaClient,
  table: string,
  data: any[],
  options: {
    skipDuplicates?: boolean;
    validateData?: boolean;
  } = {}
) {
  try {
    const { skipDuplicates = true, validateData = true } = options;

    if (validateData) {
      // Basic validation - ensure required fields are present
      // You should enhance this based on your schema requirements
      if (!data.every(item => Object.keys(item).length > 0)) {
        throw new Error("Invalid data format - empty objects detected");
      }
    }

    const result = await prisma[table].createMany({
      data,
      skipDuplicates,
    });

    await logAuditEvent(
      prisma,
      AuditAction.IMPORT,
      table,
      "",
      { recordCount: data.length, success: result.count }
    );

    return { 
      success: true, 
      importedCount: result.count 
    };
  } catch (error) {
    console.error(`Failed to import to ${table}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
