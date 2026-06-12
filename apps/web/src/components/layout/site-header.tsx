import Link from "next/link";
import { HeaderRight } from "@/components/layout/header-right";
import type { SiteSettings } from "@/types/page";

type Props = {
  settings: SiteSettings | null;
};

export const SiteHeader = ({ settings }: Props) => {
  const navigation = settings?.header?.navigation ?? [];
  const siteName = settings?.siteName;

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        {siteName ? (
          <Link href="/" prefetch className="text-2xl font-heading leading-none tracking-tight">
            {siteName}
          </Link>
        ) : (
          <div />
        )}
        <HeaderRight navigation={navigation} />
      </div>
    </header>
  );
};
