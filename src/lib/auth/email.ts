import nodemailer from "nodemailer"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Token generation
function generateToken(): string {
  return randomBytes(32).toString("hex")
}

// Email verification
export async function sendVerificationEmail(userId: string, email: string) {
  const token = generateToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await db.verificationToken.create({
    data: {
      userId,
      token,
      expires,
    },
  })

  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your email address",
    html: `
      <h1>Email Verification</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `,
  })
}

// Password reset
export async function sendPasswordResetEmail(email: string) {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return // Don't reveal if user exists

  const token = generateToken()
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  await db.resetToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  })
}

// Reset password
export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await db.resetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken || resetToken.expires < new Date()) {
    throw new Error("Invalid or expired reset token")
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await db.$transaction([
    // Update password
    db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    // Delete used token
    db.resetToken.delete({
      where: { id: resetToken.id },
    }),
  ])
}

// Verify email
export async function verifyEmail(token: string) {
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken || verificationToken.expires < new Date()) {
    throw new Error("Invalid or expired verification token")
  }

  await db.$transaction([
    // Mark email as verified
    db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    }),
    // Delete used token
    db.verificationToken.delete({
      where: { id: verificationToken.id },
    }),
  ])
}
