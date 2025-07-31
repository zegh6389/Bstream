import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  BACKUP = "BACKUP",
  RESTORE = "RESTORE",
  ARCHIVE = "ARCHIVE",
  ACCESS = "ACCESS",
}

export interface AuditLog {
  userId: string
  action: AuditAction
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
}

export async function logAuditEvent(
  prisma: PrismaClient,
  action: AuditAction,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>,
  metadata?: { ip?: string; userAgent?: string }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized audit log attempt")
  }

  return prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action,
      resource,
      resourceId,
      details,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
      createdAt: new Date(),
    },
  })
}
