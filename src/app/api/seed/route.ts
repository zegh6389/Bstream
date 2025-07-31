import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Create default categories
    const defaultCategories = [
      // Income categories
      { name: "Sales", type: "INCOME", description: "Product or service sales", color: "#10b981" },
      { name: "Consulting", type: "INCOME", description: "Consulting services", color: "#3b82f6" },
      { name: "Investments", type: "INCOME", description: "Investment returns", color: "#8b5cf6" },
      { name: "Freelance", type: "INCOME", description: "Freelance work", color: "#f59e0b" },
      { name: "Other Income", type: "INCOME", description: "Other income sources", color: "#6b7280" },
      
      // Expense categories
      { name: "Office Supplies", type: "EXPENSE", description: "Office supplies and equipment", color: "#ef4444" },
      { name: "Utilities", type: "EXPENSE", description: "Electricity, water, internet", color: "#f97316" },
      { name: "Rent", type: "EXPENSE", description: "Office or property rent", color: "#84cc16" },
      { name: "Marketing", type: "EXPENSE", description: "Marketing and advertising", color: "#06b6d4" },
      { name: "Travel", type: "EXPENSE", description: "Business travel expenses", color: "#a855f7" },
      { name: "Meals", type: "EXPENSE", description: "Business meals and entertainment", color: "#ec4899" },
      { name: "Software", type: "EXPENSE", description: "Software subscriptions and licenses", color: "#14b8a6" },
      { name: "Insurance", type: "EXPENSE", description: "Business insurance", color: "#f43f5e" },
      { name: "Taxes", type: "EXPENSE", description: "Taxes and fees", color: "#64748b" },
      { name: "Other Expenses", type: "EXPENSE", description: "Other business expenses", color: "#6b7280" },
    ]

    // Create categories if they don't exist
    for (const categoryData of defaultCategories) {
      await db.category.upsert({
        where: { name: categoryData.name },
        update: {},
        create: categoryData,
      })
    }

    // Create a default user if none exists
    const defaultUser = await db.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        name: "Demo User",
      },
    })

    // Create a default business for the user
    const defaultBusiness = await db.business.upsert({
      where: { 
        userId_name: {
          userId: defaultUser.id,
          name: "Main Business"
        }
      },
      update: {},
      create: {
        name: "Main Business",
        description: "Primary business entity",
        userId: defaultUser.id,
      },
    })

    // Create some sample transactions
    const sampleTransactions = [
      {
        amount: 1500.00,
        description: "Monthly consulting fee",
        vendor: "Client A",
        type: "INCOME" as const,
        status: "COMPLETED" as const,
        userId: defaultUser.id,
        businessId: defaultBusiness.id,
        categoryId: (await db.category.findFirst({ where: { name: "Consulting" } }))?.id,
      },
      {
        amount: -45.50,
        description: "Office supplies purchase",
        vendor: "Staples",
        type: "EXPENSE" as const,
        status: "COMPLETED" as const,
        userId: defaultUser.id,
        businessId: defaultBusiness.id,
        categoryId: (await db.category.findFirst({ where: { name: "Office Supplies" } }))?.id,
      },
      {
        amount: -120.00,
        description: "Monthly electricity bill",
        vendor: "Electric Company",
        type: "EXPENSE" as const,
        status: "COMPLETED" as const,
        userId: defaultUser.id,
        businessId: defaultBusiness.id,
        categoryId: (await db.category.findFirst({ where: { name: "Utilities" } }))?.id,
      },
      {
        amount: 2000.00,
        description: "Q2 sales payment",
        vendor: "Client B",
        type: "INCOME" as const,
        status: "COMPLETED" as const,
        userId: defaultUser.id,
        businessId: defaultBusiness.id,
        categoryId: (await db.category.findFirst({ where: { name: "Sales" } }))?.id,
      },
      {
        amount: -300.00,
        description: "Flight to conference",
        vendor: "Travel Agency",
        type: "EXPENSE" as const,
        status: "PENDING" as const,
        userId: defaultUser.id,
        businessId: defaultBusiness.id,
        categoryId: (await db.category.findFirst({ where: { name: "Travel" } }))?.id,
      },
    ]

    for (const transactionData of sampleTransactions) {
      await db.transaction.create({
        data: transactionData,
      })
    }

    return NextResponse.json({ 
      message: "Database seeded successfully",
      user: defaultUser,
      business: defaultBusiness,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}