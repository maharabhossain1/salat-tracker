export type NavItem = {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export type BreadcrumbItem = {
  title: string;
  href?: string;
};
