import { render, screen } from "@testing-library/react";
import { AuthPromo } from "../src/components/auth-promo";
import { describe, it, expect } from "vitest";

describe("AuthPromo", () => {
  it("renders the promo content", () => {
    render(<AuthPromo />);

    // Check for the main heading
    expect(screen.getByText("Unlock the Power of AI for Your Finances")).toBeInTheDocument();

    // Check for the feature headings
    expect(screen.getByText("Automated Bookkeeping")).toBeInTheDocument();
    expect(screen.getByText("Real-time Financial Insights")).toBeInTheDocument();
    expect(screen.getByText("Collaborate with Your Team")).toBeInTheDocument();

    // Check for the quote
    expect(screen.getByText(/This platform has transformed how we manage our finances./)).toBeInTheDocument();
    expect(screen.getByText("- Awais Zegham, CEO of a Bstream")).toBeInTheDocument();
  });
});
