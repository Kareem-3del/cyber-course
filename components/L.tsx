"use client";
import NextLink, { LinkProps } from "next/link";
import { useI18n } from "@/lib/i18n";
import { forwardRef, AnchorHTMLAttributes } from "react";

type Props = Omit<LinkProps, "href"> &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * Locale-aware Link. Drop-in replacement for next/link that auto-prefixes
 * internal hrefs with the active locale.
 */
export const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, ...rest },
  ref
) {
  const { href: build } = useI18n();
  return <NextLink ref={ref} href={build(href)} {...rest} />;
});
