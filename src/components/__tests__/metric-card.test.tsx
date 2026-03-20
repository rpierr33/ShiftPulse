import React from "react";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "@/components/shared/metric-card";

// Mock next/link to render a simple anchor
function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = "MockLink";
jest.mock("next/link", () => MockLink);

describe("MetricCard", () => {
  it("renders the label and value", () => {
    render(<MetricCard label="Active Nurses" value={42} />);
    expect(screen.getByText("Active Nurses")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a string value", () => {
    render(<MetricCard label="Status" value="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders subtext when provided", () => {
    render(<MetricCard label="Shifts" value={10} subtext="this week" />);
    expect(screen.getByText("this week")).toBeInTheDocument();
  });

  it("does not render subtext when not provided", () => {
    const { container } = render(<MetricCard label="Shifts" value={10} />);
    const subtextElements = container.querySelectorAll(".text-xs.mt-1.opacity-60");
    expect(subtextElements).toHaveLength(0);
  });

  it("wraps content in a link when href is provided", () => {
    render(<MetricCard label="Details" value={5} href="/dashboard" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("does not render a link when href is not provided", () => {
    render(<MetricCard label="Count" value={3} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("applies default blue color classes", () => {
    const { container } = render(<MetricCard label="Test" value={1} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-blue-50");
    expect(card.className).toContain("text-blue-700");
  });

  it("applies specified color classes", () => {
    const { container } = render(<MetricCard label="Alerts" value={3} color="red" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-red-50");
    expect(card.className).toContain("text-red-700");
  });

  it("falls back to blue for unknown color", () => {
    const { container } = render(
      <MetricCard label="Test" value={1} color="magenta" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-blue-50");
  });

  it("applies custom className", () => {
    const { container } = render(
      <MetricCard label="Test" value={1} className="my-custom-class" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("my-custom-class");
  });

  it("applies hover classes when href is provided", () => {
    const { container } = render(
      <MetricCard label="Link Card" value={1} href="/test" />
    );
    const link = container.querySelector("a");
    const card = link?.firstChild as HTMLElement;
    expect(card.className).toContain("cursor-pointer");
  });
});
