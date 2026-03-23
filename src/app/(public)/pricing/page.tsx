import type { Metadata } from "next";
import { PricingPageContent } from "./pricing-content";

export const metadata: Metadata = {
  title: "Pricing | CareCircle - Nurse Workforce Management",
  description:
    "Simple, transparent pricing for healthcare workforce management. Start with our Basic plan at $19.99/month or unlock full compliance and reporting with Professional.",
};

export default function PricingPage() {
  return <PricingPageContent />;
}
