import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "./auth/auth-options";
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from './db';

interface SessionMetadata {
  ip: string;
  userAgent: string;
  lastActive: Date;
}

declare module "next-auth" {
  interface Session {
    metadata?: SessionMetadata;
  }
}

declare module "next/server" {
  interface NextRequest {
    ip?: string;
  }
}

export async function validateSession(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.metadata) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metadata = session.metadata;
  
  // Validate IP hasn't changed dramatically (potential session hijacking)
  if (metadata.ip && metadata.ip !== request.ip) {
    return NextResponse.json({ error: 'Session invalid' }, { status: 403 });
  }

  // Validate user agent hasn't changed (potential session hijacking)
  const currentUserAgent = request.headers.get('user-agent') || '';
  if (metadata.userAgent && metadata.userAgent !== currentUserAgent) {
    return NextResponse.json({ error: 'Session invalid' }, { status: 403 });
  }

  // Check session age and activity
  const lastActive = new Date(metadata.lastActive);
  const inactiveTime = Date.now() - lastActive.getTime();
  
  // Force re-authentication after 24 hours of inactivity
  if (inactiveTime > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  // Update last active timestamp
  session.metadata.lastActive = new Date();

  return NextResponse.next();
}

export async function createSessionMetadata(request: NextRequest): Promise<SessionMetadata> {
  return {
    ip: request.ip || '',
    userAgent: request.headers.get('user-agent') || '',
    lastActive: new Date(),
  };
}

export async function revokeSession(sessionToken: string) {
  await prisma.session.delete({
    where: {
      sessionToken,
    },
  });
}
