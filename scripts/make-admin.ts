import { db } from "@/lib/db"

async function makeAdmin(email: string) {
  try {
    const user = await db.user.update({
      where: { email },
      data: { isAdmin: true }
    })
    console.log(`Successfully made ${user.email} an admin`)
  } catch (error) {
    console.error("Error making user admin:", error)
  } finally {
    await db.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error("Please provide an email address")
  process.exit(1)
}

makeAdmin(email)
