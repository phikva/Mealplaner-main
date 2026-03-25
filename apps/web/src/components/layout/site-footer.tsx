import Link from "next/link";
import type { SiteSettings } from "@/types/page";

type Props = {
  settings: SiteSettings | null;
};

export const SiteFooter = ({ settings }: Props) => {
  const links = settings?.footer?.links ?? [];
  const text = settings?.footer?.text;

  if (!text && links.length === 0) {
    return null;
  }

  return (
    <footer className="mt-14 border-t bg-secondary/35">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        {text ? <p className="max-w-2xl text-sm text-muted-foreground">{text}</p> : null}
        {links.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-5">
            {links.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
};
