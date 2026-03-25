import Link from "next/link";
import type { SiteSettings } from "@/types/page";

type Props = {
  settings: SiteSettings | null;
};

export const SiteHeader = ({ settings }: Props) => {
  const navigation = settings?.header?.navigation ?? [];
  const siteName = settings?.siteName;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {siteName ? (
          <Link href="/" className="text-2xl font-heading leading-none tracking-tight">
            {siteName}
          </Link>
        ) : <div />}
        {navigation.length > 0 ? (
          <nav className="flex items-center gap-2 rounded-full bg-card/80 p-1.5">
            {navigation.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
};
