export const INDUSTRIES = [
  { value: "restaurant", label: "Restaurant & Food Service" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "legal", label: "Legal Services" },
  { value: "real-estate", label: "Real Estate" },
  { value: "automotive", label: "Automotive" },
  { value: "salon", label: "Salon & Beauty" },
  { value: "fitness", label: "Fitness & Wellness" },
  { value: "education", label: "Education & Training" },
  { value: "finance", label: "Financial Services" },
  { value: "travel", label: "Travel & Hospitality" },
  { value: "tech", label: "Technology & SaaS" },
  { value: "construction", label: "Construction & Home Services" },
  { value: "professional", label: "Professional Services" },
  { value: "other", label: "Other" },
] as const;

export type IndustryValue = (typeof INDUSTRIES)[number]["value"];
