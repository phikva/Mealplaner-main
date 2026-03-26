import Link from "next/link";
import type { SiteSettings } from "@/types/page";

type Props = {
  settings: SiteSettings | null;
};

export const SiteHeader = ({ settings }: Props) => {
  const navigation = settings?.header?.navigation ?? [];
  const siteName = settings?.siteName;

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {siteName ? (
          <Link href="/" className="text-2xl font-heading leading-none tracking-tight">
            {siteName}
          </Link>
        ) : <div />}
        {navigation.length > 0 ? (
          <nav className="flex items-center gap-1 md:gap-2">
            {navigation.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="px-2 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground md:px-3"
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
