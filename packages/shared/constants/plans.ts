export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      messages_per_month: 100,
      knowledge_sources: 3,
      file_size_mb: 5,
    },
    features: [
      "1 chatbot",
      "100 messages/month",
      "3 knowledge sources",
      "Basic analytics",
    ],
  },
  pro: {
    name: "Pro",
    price: 49,
    limits: {
      messages_per_month: 5000,
      knowledge_sources: 50,
      file_size_mb: 25,
    },
    features: [
      "1 chatbot",
      "5,000 messages/month",
      "50 knowledge sources",
      "Advanced analytics",
      "Lead capture",
      "Custom branding",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    limits: {
      messages_per_month: -1,
      knowledge_sources: -1,
      file_size_mb: 100,
    },
    features: [
      "Unlimited chatbots",
      "Unlimited messages",
      "Unlimited knowledge sources",
      "Full analytics suite",
      "Lead capture + CRM integration",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
