"use client";
import { Link } from "@/components/L";
import { useI18n, T } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";
import { FileText, ShieldCheck, ArrowRight, ArrowLeft, Home, ChevronLeft, ChevronRight } from "lucide-react";

export default function LegalIndex() {
  const { lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-10 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 border-[3px] border-black bg-white hover:bg-black hover:text-white font-bold uppercase tracking-[0.12em] text-[11px]"
        >
          <Home className="w-3.5 h-3.5" strokeWidth={3} />
          <T ar="الرئيسية" en="Home" />
        </Link>
        <Chevron className="w-3.5 h-3.5 opacity-50" strokeWidth={3} />
        <span className="px-3 py-2 border-[3px] border-black bg-black text-white font-bold uppercase tracking-[0.12em] text-[11px]">
          <T ar="القانوني" en="Legal" />
        </span>
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-4">
        <T ar="القسم القانوني" en="Legal" />
      </div>
      <h1 className="font-display text-[clamp(40px,6vw,80px)] leading-[0.95] tracking-tighter mb-6">
        <T ar="الوثائق القانونية" en="Legal Documents" />
      </h1>
      <p className="text-[16px] leading-relaxed mb-10 max-w-2xl">
        <T
          ar="اقرأ هذه الوثائق قبل استخدام الأكاديمية. وصولك للمواد التعليمية يعني قبولك لهذه الشروط وهذه السياسة."
          en="Read these documents before using the Academy. Accessing the materials means you accept the Terms and the Privacy Policy."
        />
      </p>

      <div className="grid md:grid-cols-2 gap-0 border-[3px] border-black">
        <Link href="/legal/terms" className="p-6 md:p-8 border-e-0 md:border-e-[3px] border-b-[3px] md:border-b-0 border-black bg-white hover:bg-black hover:text-white group">
          <FileText className="w-6 h-6 mb-4" strokeWidth={3} />
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] mb-2 opacity-70">
            <T ar={`الإصدار ${LEGAL.terms.version}`} en={`v${LEGAL.terms.version}`} />
            <span className="mx-2">·</span>
            <span className="eng">{LEGAL.terms.effectiveDate}</span>
          </div>
          <div className="font-display text-[clamp(24px,3.2vw,36px)] tracking-tighter leading-[1.05] mb-3">
            <T ar="شروط الاستخدام" en="Terms of Service" />
          </div>
          <p className="text-[14px] leading-relaxed mb-5">
            <T
              ar="القواعد التي تحكم وصولك إلى المحتوى، حدود الاستخدام، إخلاء المسؤولية، والقانون الواجب التطبيق."
              en="The rules governing your access to the content, use limits, disclaimers, and governing law."
            />
          </p>
          <div className="font-mono text-[12px] uppercase tracking-[0.16em] inline-flex items-center gap-2">
            <T ar="اقرأ" en="Read" /> <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </Link>

        <Link href="/legal/privacy" className="p-6 md:p-8 bg-white hover:bg-black hover:text-white group">
          <ShieldCheck className="w-6 h-6 mb-4" strokeWidth={3} />
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] mb-2 opacity-70">
            <T ar={`الإصدار ${LEGAL.privacy.version}`} en={`v${LEGAL.privacy.version}`} />
            <span className="mx-2">·</span>
            <span className="eng">{LEGAL.privacy.effectiveDate}</span>
          </div>
          <div className="font-display text-[clamp(24px,3.2vw,36px)] tracking-tighter leading-[1.05] mb-3">
            <T ar="سياسة الخصوصية" en="Privacy Policy" />
          </div>
          <p className="text-[14px] leading-relaxed mb-5">
            <T
              ar="ما البيانات التي نجمعها، كيف نستخدمها، حقوقك في الوصول والحذف، والأطراف الثالثة."
              en="What data we collect, how we use it, your rights of access and deletion, and our third-party services."
            />
          </p>
          <div className="font-mono text-[12px] uppercase tracking-[0.16em] inline-flex items-center gap-2">
            <T ar="اقرأ" en="Read" /> <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </Link>
      </div>

      <div className="mt-10 border-[3px] border-black p-6 bg-[var(--rb-sunken,#F0F0F0)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] mb-2">
          <T ar="ملاحظة هامة" en="Important Notice" />
        </div>
        <p className="text-[14px] leading-relaxed">
          <T
            ar="هذه الوثائق قوالب تأسيسية كُتبت بصيغة قانونية عامة. قبل أي إطلاق علني، يجب مراجعتها من قبل محامٍ مرخّص في الولاية القضائية التي ستعمل فيها الأكاديمية، خاصة لمراعاة CFAA، GDPR، CCPA، وأي تشريعات محلية متعلقة بالمحتوى السيبراني الهجومي."
            en="These documents are foundational templates drafted in general legal form. Before any public launch they must be reviewed by counsel licensed in the operating jurisdiction — particularly for CFAA, GDPR, CCPA compliance and any local regulations governing offensive-security content."
          />
        </p>
      </div>
    </div>
  );
}
