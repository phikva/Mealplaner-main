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
    <footer className="mt-14 bg-secondary/18">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        {text ? <p className="max-w-2xl text-base text-muted-foreground">{text}</p> : null}
        {links.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-5">
            {links.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="font-sans text-[11px] font-semibold tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground"
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
