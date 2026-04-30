"use client";
import Image from "next/image";
import { Link } from "@/components/L";
import { useState } from "react";
import { Menu, ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n, T } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { LESSONS } from "@/lib/lessons";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Sidebar } from "./Sidebar";
import { CourseTabs } from "./CourseTabs";

/* =============== PUBLIC SHELL — landing page, no sidebar ============== */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="min-w-0">{children}</main>
      <SiteFooter />
    </>
  );
}

export function PublicHeader() {
  const { lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <header className="sticky top-0 z-40 bg-white border-b-[5px] border-black">
      <div className="px-4 md:px-10 h-[72px] flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 border-[3px] border-black bg-white flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="Cyber Operations Academy logo" width={32} height={32} className="w-8 h-8 object-contain" priority />
            </div>
          <div className="leading-none">
            <div className="font-display text-[15px] tracking-tight">
              <T ar="أكاديمية العمليات السيبرانية" en="CYBER OPERATIONS ACADEMY" />
            </div>
            <div className="text-[10px] mt-1 text-black/60 eng tracking-[0.18em] uppercase">Red / Blue / Ops</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-0 border-[3px] border-black bg-white">
          <a href="#what" className="px-4 py-2 text-[13px] font-bold uppercase tracking-[0.12em] border-e-[3px] border-black hover:bg-black hover:text-white">
            <T ar="ما هي" en="What" />
          </a>
          <a href="#path" className="px-4 py-2 text-[13px] font-bold uppercase tracking-[0.12em] border-e-[3px] border-black hover:bg-black hover:text-white">
            <T ar="المسار" en="Path" />
          </a>
          <a href="#audience" className="px-4 py-2 text-[13px] font-bold uppercase tracking-[0.12em] border-e-[3px] border-black hover:bg-black hover:text-white">
            <T ar="لمن" en="Who" />
          </a>
          <a href="#faq" className="px-4 py-2 text-[13px] font-bold uppercase tracking-[0.12em] border-e-[3px] border-black hover:bg-black hover:text-white">
            FAQ
          </a>
          <Link href="/contact" className="px-4 py-2 text-[13px] font-bold uppercase tracking-[0.12em] hover:bg-black hover:text-white">
            <T ar="تواصل" en="Contact" />
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/course"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-black text-white border-[3px] border-black font-bold text-[12px] uppercase tracking-[0.12em] hover:bg-white hover:text-black"
          >
            <T ar="ادخل الدورة" en="Enter Course" />
            <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
          </Link>
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}

/* =============== COURSE SHELL — sidebar + course tabs ============== */
export function CourseShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CourseHeader onMenu={() => setOpen(true)} />
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <CourseTabs />
          <main className="flex-1 px-4 md:px-10 py-10 max-w-[1200px] w-full mx-auto">{children}</main>
          <SiteFooter />
        </div>
      </div>
    </>
  );
}

function CourseHeader({ onMenu }: { onMenu?: () => void }) {
  const { completed } = useProgress();
  const total = LESSONS.length;
  const done = LESSONS.filter((l) => completed.has(l.slug)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b-[5px] border-black">
      <div className="px-4 md:px-8 h-[72px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onMenu && (
            <button
              onClick={onMenu}
              className="md:hidden p-2 border-[3px] border-black bg-white"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 border-[3px] border-black bg-white flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="Cyber Operations Academy logo" width={32} height={32} className="w-8 h-8 object-contain" priority />
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] tracking-tight">
                <T ar="أكاديمية العمليات السيبرانية" en="CYBER OPERATIONS ACADEMY" />
              </div>
              <div className="text-[10px] mt-1 text-black/60 eng tracking-[0.18em] uppercase">Red / Blue / Ops</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 border-[3px] border-black bg-white text-[11px] font-bold uppercase tracking-[0.12em]">
            <span className="eng">{pct}%</span>
            <div className="w-20 h-1.5 bg-white border border-black overflow-hidden">
              <div className="h-full bg-black" style={{ width: `${pct}%` }} />
            </div>
            <span className="eng text-black/60">{done}/{total}</span>
          </div>
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-[5px] border-black mt-16 bg-white">
      <div className="px-4 md:px-10 py-8 max-w-[1400px] mx-auto grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="max-w-2xl text-[13px] leading-relaxed">
          <T
            ar="© دورة تعليمية للجهات المخوّلة. الاستخدام لأغراض الدفاع و الاختبار المُصرّح به فقط."
            en="© Educational material for authorized parties. For defensive and authorized testing use only."
          />
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] uppercase tracking-[0.12em] font-bold">
          <Link href="/contact" className="hover:underline underline-offset-[5px]">
            <T ar="تواصل" en="Contact" />
          </Link>
          <Link href="/legal/terms" className="hover:underline underline-offset-[5px]">
            <T ar="الشروط" en="Terms" />
          </Link>
          <Link href="/legal/privacy" className="hover:underline underline-offset-[5px]">
            <T ar="الخصوصية" en="Privacy" />
          </Link>
          <Link href="/legal" className="hover:underline underline-offset-[5px]">
            <T ar="القانوني" en="Legal" />
          </Link>
          <span className="eng text-black/60 normal-case tracking-normal font-normal">// Authorized Training Material</span>
        </nav>
      </div>
      <div className="rb-stripes h-3" aria-hidden />
    </footer>
  );
}

/* Backward-compat alias so old imports don't break. */
export const AppShell = CourseShell;
