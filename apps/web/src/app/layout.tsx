import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { Suspense } from "react";
import { SessionProvider } from "@/components/auth/session-provider";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { env } from "@/lib/env";
import { getBrukerprofilSettings } from "@/lib/sanity/brukerprofil";
import { getActiveOnboarding } from "@/lib/sanity/onboarding";
import { urlFor } from "@/lib/sanity/image";
import { getSiteSettings } from "@/lib/sanity/settings";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fallbackSiteName = new URL(env.nextPublicSiteUrl).hostname;

  const siteName = settings?.siteName || fallbackSiteName;
  const title = settings?.seo?.defaultMetaTitle || siteName;
  const description = settings?.seo?.defaultMetaDescription;
  const canonicalBase = settings?.siteUrl || env.nextPublicSiteUrl;
  const ogImageUrl = settings?.seo?.defaultOgImage
    ? urlFor(settings.seo.defaultOgImage).width(1200).height(630).fit("crop").url()
    : undefined;
  const noIndex = settings?.seo?.robots?.noIndex ?? false;
  const noFollow = settings?.seo?.robots?.noFollow ?? false;

  return {
    metadataBase: new URL(canonicalBase),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description: description || undefined,
    robots: {
      index: !noIndex,
      follow: !noFollow,
    },
    openGraph: {
      title,
      description: description || undefined,
      type: "website",
      siteName,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, onboarding, brukerprofilSettings] = await Promise.all([
    getSiteSettings(),
    getActiveOnboarding(),
    getBrukerprofilSettings(),
  ]);

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <SiteHeader settings={settings} />
          {children}
          <SiteFooter settings={settings} />
          <SonnerToaster />
          <Suspense fallback={null}>
            <OnboardingGate onboarding={onboarding} profileSettings={brukerprofilSettings} />
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
