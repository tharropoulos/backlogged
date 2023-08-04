import { type Icons } from "~/components/icons";

export type NavItem = {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  description?: string;
};

export type NavItemWithChildren = NavItem & {
  items: NavItem[];
};

export type NavItemWithOptionalChildren = NavItem & {
  items?: NavItemWithChildren[];
};
export type MainNavItem = NavItemWithOptionalChildren;

export type FooterItem = {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
};
