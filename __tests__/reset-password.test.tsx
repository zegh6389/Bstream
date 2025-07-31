import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi } from "vitest"
import RequestResetPage from "../src/app/auth/reset-password/page"
import { useRouter } from "next/navigation"
import { useToast } from "../src/hooks/use-toast"

// Mock the next/navigation module
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

// Mock the useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

describe("RequestResetPage", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it("renders the reset password form", () => {
    render(<RequestResetPage />)
    
    expect(screen.getByText("Reset Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeInTheDocument()
  })

  it("shows validation error for invalid email", async () => {
    render(<RequestResetPage />)
    
    const emailInput = screen.getByLabelText("Email")
    fireEvent.change(emailInput, { target: { value: "invalid-email" } })
    
    const form = screen.getByRole("form")
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it("handles successful reset request", async () => {
    const mockToast = vi.fn()
    ;(useToast as any).mockReturnValue({ toast: mockToast })

    // Mock fetch response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    render(<RequestResetPage />)
    
    const emailInput = screen.getByLabelText("Email")
    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Reset email sent",
        description: "If an account exists with this email, you will receive a password reset link.",
      })
      expect(screen.getByText("Please check your email for a reset link")).toBeInTheDocument()
    })
  })

  it("handles reset request error", async () => {
    const mockToast = vi.fn()
    ;(useToast as any).mockReturnValue({ toast: mockToast })

    // Mock fetch response with error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Failed to send reset email"))

    render(<RequestResetPage />)
    
    const emailInput = screen.getByLabelText("Email")
    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    
    const submitButton = screen.getByRole("button", { name: "Send Reset Link" })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to send reset email",
        variant: "destructive",
      })
    })
  })

  it("navigates back to sign in page", () => {
    const mockPush = vi.fn()
    ;(useRouter as any).mockReturnValue({ push: mockPush })

    render(<RequestResetPage />)
    
    const backButton = screen.getByRole("button", { name: "Back to Sign In" })
    fireEvent.click(backButton)
    
    expect(mockPush).toHaveBeenCalledWith("/auth/signin")
  })
})
