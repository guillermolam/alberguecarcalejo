import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "../input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
