export type Category = { slug: string; name: string; blurb: string };

/** The 24 boards. Order here is the order shown on /categories. */
export const CATEGORIES: Category[] = [
  { slug: "ai-agents-infrastructure", name: "AI Agents & Infrastructure", blurb: "Agent frameworks, orchestration, inference and model plumbing." },
  { slug: "developer-tools", name: "Developer Tools", blurb: "Editors, CI, debuggers, SDKs and everything else on a dev machine." },
  { slug: "seo-ai-visibility", name: "SEO & AI Visibility", blurb: "Ranking in search engines and inside answer engines." },
  { slug: "marketing-advertising", name: "Marketing & Advertising", blurb: "Campaigns, attribution, ad buying and growth tooling." },
  { slug: "crypto-web3", name: "Crypto & Web3", blurb: "Chains, wallets, exchanges and on-chain infrastructure." },
  { slug: "business-finance", name: "Business & Finance", blurb: "Accounting, invoicing, banking and back office." },
  { slug: "security-compliance", name: "Security & Compliance", blurb: "Scanning, secrets, audits and certification." },
  { slug: "health-fitness", name: "Health & Fitness", blurb: "Training, tracking, nutrition and clinical tools." },
  { slug: "social-creator-tools", name: "Social & Creator Tools", blurb: "Scheduling, editing and monetising an audience." },
  { slug: "hiring-careers", name: "Hiring & Careers", blurb: "Job boards, applicant tracking, interviewing and resumes." },
  { slug: "education", name: "Education", blurb: "Courses, tutoring, curriculum and study tools." },
  { slug: "agencies-services", name: "Agencies & Services", blurb: "Studios, contractors and done-for-you work." },
  { slug: "ecommerce", name: "Ecommerce", blurb: "Storefronts, checkout, logistics and merchandising." },
  { slug: "domains-web-assets", name: "Domains & Web Assets", blurb: "Domains, newsletters, sites and other assets for sale." },
  { slug: "games", name: "Games", blurb: "Games, engines, mods and the tooling around them." },
  { slug: "design-creative", name: "Design & Creative", blurb: "Design tools, asset libraries and creative workflow." },
  { slug: "writing-content", name: "Writing & Content", blurb: "Drafting, editing, publishing and content operations." },
  { slug: "productivity", name: "Productivity", blurb: "Notes, tasks, calendars and focus." },
  { slug: "directories-launch", name: "Directories & Launch", blurb: "Directories, launch platforms and distribution." },
  { slug: "ai-media", name: "AI Media", blurb: "Generated image, video and 3D." },
  { slug: "audio-voice", name: "Audio & Voice", blurb: "Speech, music, transcription and telephony." },
  { slug: "sales-lead-gen", name: "Sales & Lead Gen", blurb: "Prospecting, CRM, outbound and enrichment." },
  { slug: "travel-local", name: "Travel & Local", blurb: "Booking, maps, logistics and local discovery." },
  { slug: "other", name: "Other", blurb: "Everything that refuses to sit in the other 23 boards." },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
  return BY_SLUG.get(slug);
}

export function categoryName(slug: string | null | undefined): string {
  if (!slug) return "Other";
  return BY_SLUG.get(slug)?.name ?? "Other";
}

export function isCategorySlug(slug: string): boolean {
  return BY_SLUG.has(slug);
}
