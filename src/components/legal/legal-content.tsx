import { ExternalLink } from "lucide-react";

import type { LegalSection } from "@/content/legal/billing-disclosures";

type LegalContentProps = {
  sections: LegalSection[];
};

export function LegalContent({ sections }: LegalContentProps) {
  return (
    <div className="grid gap-6">
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-2xl border border-slate-800 bg-[#0B1220]/85 p-6 shadow-[0_0_28px_rgba(56,189,248,0.05)]"
        >
          <h2 className="text-xl font-black text-slate-100">
            {section.title}
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {section.bullets ? (
            <ul className="mt-5 grid gap-2 text-sm leading-6 text-slate-300">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}

          {section.links ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {section.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
                >
                  {link.label}
                  {link.external ? (
                    <>
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      <span className="sr-only">opens in a new tab</span>
                    </>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
