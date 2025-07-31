import { authenticator } from "otplib"
import { db } from "@/lib/db"
import QRCode from "qrcode"

export async function generateTwoFactorSecret(userId: string) {
  const secret = authenticator.generateSecret()
  
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false, // Will be enabled after verification
    },
  })

  const otpauth = authenticator.keyuri(
    userId,
    "Z.ai Finance",
    secret
  )

  const qrCode = await QRCode.toDataURL(otpauth)

  return {
    secret,
    qrCode,
  }
}

export async function verifyTwoFactorToken(userId: string, token: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  })

  if (!user?.twoFactorSecret) {
    throw new Error("2FA not set up")
  }

  const isValid = authenticator.verify({
    token,
    secret: user.twoFactorSecret,
  })

  if (isValid) {
    await db.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    })
  }

  return isValid
}

export async function validateTwoFactorToken(userId: string, token: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user?.twoFactorEnabled) {
    return true // 2FA not enabled, so validation passes
  }

  if (!user?.twoFactorSecret) {
    throw new Error("2FA configuration error")
  }

  return authenticator.verify({
    token,
    secret: user.twoFactorSecret,
  })
}
