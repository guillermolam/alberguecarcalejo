import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText(/new/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-primary/);
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Info</Badge>);
    const badge = screen.getByText(/info/i);
    expect(badge.className).toMatch(/bg-secondary/);
  });
});
