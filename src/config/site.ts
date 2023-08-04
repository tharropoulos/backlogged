import type { FooterItem, MainNavItem } from "@/types";

export type SiteConfig = typeof siteConfig;

const links = {
  github: "https://github.com/tharropoulos/backlogged",
  githubAccount: "https://github.com/tharropoulos",
  discord: "aphextwin.",
  linkedin: "https://www.linkedin.com/in/fanis-tharropoulos-78012622b/",
};

export const siteConfig = {
  name: "Backlogged",
  description: "An open source, web-based gaming backlog manager.",
  url: "https://backlogged.vercel.app",
  ogImage: "",
  mainNav: [
    {
      title: "Home",
      items: [
        {
          title: "Get Started",
          href: "/",
          description: "Learn more about Backlogged",
          items: [],
        },
        {
          title: "Blog",
          href: "/blog",
          description: "Read the latest news and updates",
          items: [],
        },
        {
          title: "Get In Touch",
          href: "/contact",
          description: "Contact us",
          items: [],
        },
      ],
    },
    {
      title: "Games",
      items: [
        {
          title: "Browse",
          href: "/games",
          description: "Browse our game library",
          items: [],
        },
        {
          title: "Search",
          href: "/games/search",
          description: "Search our game library",
          items: [],
        },
        {
          title: "Popular",
          href: "/games/popular",
          description: "Browse our most popular games",
          items: [],
        },
        {
          title: "New",
          href: "/games/new",
          description: "Browse our newest games",
          items: [],
        },
      ],
    },
    {
      title: "Franchises",
      items: [
        {
          title: "Browse",
          href: "/franchises",
          description: "Browse our franchise library",
          items: [],
        },
        {
          title: "Search",
          href: "/franchises/search",
          description: "Search our franchise library",
          items: [],
        },
        {
          title: "Popular",
          href: "/franchises/popular",
          description: "Browse our most popular franchises",
          items: [],
        },
      ],
    },
  ] satisfies MainNavItem[],
  links,
  footerNav: [
    {
      title: "Credits",
      items: [
        {
          title: "Taxonomy",
          href: "https://tx.shadcn.com",
          external: true,
        },
        {
          title: "Skateshop13",
          href: "https://,skateshop.sadmn.com/",
          external: true,
        },
        {
          title: "shadcn/ui",
          href: "https://ui.shadcn.com",
          external: true,
        },
      ],
    },
  ] satisfies FooterItem[],
};
