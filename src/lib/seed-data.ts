import { BID_UNIT_CENTS } from "./money";

/**
 * Launch board.
 *
 * These are real, public products placed by outbid99 so the board is not empty
 * on day one. Nobody listed here paid for their position, so every one of them
 * carries `is_seed` and renders a SEED badge. The site never claims a payment
 * that did not happen. One real 99c bid outranks the lot of them.
 */
export interface SeedListing {
  slug: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  category_slug: string;
  bids: number; // whole 99c bids
}

export const SEED_LISTINGS: SeedListing[] = [
  { slug: "linear", url: "https://linear.app", domain: "linear.app", title: "Linear", description: "Issue tracking and project planning for software teams, built around keyboard-first speed.", category_slug: "productivity", bids: 8 },
  { slug: "supabase", url: "https://supabase.com", domain: "supabase.com", title: "Supabase", description: "Open source Postgres platform with auth, storage, realtime and edge functions.", category_slug: "developer-tools", bids: 7 },
  { slug: "vercel", url: "https://vercel.com", domain: "vercel.com", title: "Vercel", description: "Deployment and hosting platform for frontend frameworks, built by the makers of Next.js.", category_slug: "developer-tools", bids: 7 },
  { slug: "resend", url: "https://resend.com", domain: "resend.com", title: "Resend", description: "Transactional email API for developers, with React-based templates.", category_slug: "developer-tools", bids: 6 },
  { slug: "cloudflare", url: "https://www.cloudflare.com", domain: "cloudflare.com", title: "Cloudflare", description: "CDN, DNS, DDoS protection and edge compute for websites and APIs.", category_slug: "security-compliance", bids: 6 },
  { slug: "figma", url: "https://www.figma.com", domain: "figma.com", title: "Figma", description: "Collaborative interface design and prototyping in the browser.", category_slug: "design-creative", bids: 5 },
  { slug: "stripe", url: "https://stripe.com", domain: "stripe.com", title: "Stripe", description: "Payments infrastructure for internet businesses, from checkout to billing.", category_slug: "business-finance", bids: 5 },
  { slug: "notion", url: "https://www.notion.com", domain: "notion.com", title: "Notion", description: "Docs, wikis and databases in one connected workspace.", category_slug: "productivity", bids: 5 },
  { slug: "railway", url: "https://railway.com", domain: "railway.com", title: "Railway", description: "Infrastructure platform that deploys apps and databases from a repo.", category_slug: "developer-tools", bids: 4 },
  { slug: "posthog", url: "https://posthog.com", domain: "posthog.com", title: "PostHog", description: "Product analytics, session replay and feature flags, self-hostable.", category_slug: "marketing-advertising", bids: 4 },
  { slug: "plausible", url: "https://plausible.io", domain: "plausible.io", title: "Plausible Analytics", description: "Lightweight, cookie-free website analytics that does not track visitors across sites.", category_slug: "marketing-advertising", bids: 4 },
  { slug: "hugging-face", url: "https://huggingface.co", domain: "huggingface.co", title: "Hugging Face", description: "Model, dataset and inference hub for the open machine learning community.", category_slug: "ai-agents-infrastructure", bids: 3 },
  { slug: "ollama", url: "https://ollama.com", domain: "ollama.com", title: "Ollama", description: "Run open language models locally with a single command.", category_slug: "ai-agents-infrastructure", bids: 3 },
  { slug: "obsidian", url: "https://obsidian.md", domain: "obsidian.md", title: "Obsidian", description: "Local-first markdown knowledge base with backlinks and plugins.", category_slug: "writing-content", bids: 3 },
  { slug: "excalidraw", url: "https://excalidraw.com", domain: "excalidraw.com", title: "Excalidraw", description: "Virtual whiteboard for sketching hand-drawn style diagrams.", category_slug: "design-creative", bids: 2 },
  { slug: "fly-io", url: "https://fly.io", domain: "fly.io", title: "Fly.io", description: "Run application containers close to users on a global edge network.", category_slug: "developer-tools", bids: 2 },
  { slug: "typst", url: "https://typst.app", domain: "typst.app", title: "Typst", description: "Markup-based typesetting system for scientific and technical documents.", category_slug: "writing-content", bids: 2 },
  { slug: "caddy", url: "https://caddyserver.com", domain: "caddyserver.com", title: "Caddy", description: "Web server with automatic HTTPS certificates out of the box.", category_slug: "developer-tools", bids: 1 },
];

export function seedFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function seedTotalCents(l: SeedListing): number {
  return l.bids * BID_UNIT_CENTS;
}
