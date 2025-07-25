import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn.className).toMatch(/bg-destructive/);
  });
});
