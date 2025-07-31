import { BackupMetadata } from './backup';
import { z } from 'zod';

const backupMetadataSchema = z.object({
    version: z.string(),
    timestamp: z.string().datetime(),
    type: z.enum(['full', 'incremental']),
    format: z.enum(['json', 'csv', 'excel']),
    tables: z.array(z.string()),
    isArchived: z.boolean().optional(),
    archiveDate: z.string().datetime().optional(),
});

const tableDataSchema = z.record(z.string(), z.array(z.any()));

const backupSchema = z.object({
    metadata: backupMetadataSchema,
    data: tableDataSchema,
});

export function validateBackupData(data: unknown) {
    try {
        const result = backupSchema.parse(data);
        return {
            isValid: true,
            data: result,
            errors: null,
        };
    } catch (error) {
        return {
            isValid: false,
            data: null,
            errors: error instanceof z.ZodError ? error.issues : String(error),
        };
    }
}

export function validateBackupMetadata(metadata: unknown) {
    try {
        const result = backupMetadataSchema.parse(metadata);
        return {
            isValid: true,
            metadata: result,
            errors: null,
        };
    } catch (error) {
        return {
            isValid: false,
            metadata: null,
            errors: error instanceof z.ZodError ? error.issues : String(error),
        };
    }
}
