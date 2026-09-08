'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/app/(arena)/_components/page_header';
import { useT } from '@/app/lib/i18n';
import { rulesFor, type RuleBlock } from './content';
import {
  BookOpenIcon,
  CoinsIcon,
  SwordIcon,
  TrophyIcon,
} from '@/app/(arena)/_components/icons';

/** the icon that opens each section, by id — decoration, never the only cue */
const SECTION_ICON: Record<string, React.ReactNode> = {
  cilj: <TrophyIcon className="h-4 w-4" />,
  kladjenje: <CoinsIcon className="h-4 w-4" />,
  dvoboj: <SwordIcon className="h-4 w-4" />,
};

function Block({ block }: { block: RuleBlock }) {
  if (block.points) {
    return (
      <ul className="space-y-2">
        {block.points.map((point) => (
          <li key={point} className="flex gap-3 text-sm text-arena-100">
            {/*
              A drawn marker rather than a list bullet: the default disc sits
              on the text baseline and drifts out of line the moment a point
              wraps to a second row, which most of these do.
            */}
            <span
              className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70"
              aria-hidden="true"
            />
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.example) {
    return (
      <div className="rounded-lg border border-gold/25 bg-gold/[0.05] p-4">
        <div className="mb-3 text-[10px] tracking-[0.25em] text-gold uppercase">
          {block.example.title}
        </div>
        <ol className="space-y-1.5">
          {block.example.lines.map((line, i) => (
            <li key={line} className="flex gap-3 text-sm text-arena-100">
              <span className="w-4 shrink-0 text-right font-bold text-gold tabular-nums">
                {i + 1}
              </span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return <p className="text-sm leading-relaxed text-arena-100">{block.text}</p>;
}

/**
 * The rules, as one readable page.
 *
 * Everything a player has to guess at otherwise: what a quota actually pays,
 * why backing the favourite pays less than double, what the duel ante is and
 * why they cannot choose it, and what happens to money nobody wins. The
 * figures are the engine's own, and content.ts says which constant each one
 * comes from — a rules page that drifts from the rules is worse than none,
 * because it gets believed.
 *
 * Sections collapse on small screens and stand open above them: this is a
 * reference people come back to for one answer, and a wall of prose on a phone
 * makes finding that one answer harder than not having the page.
 */
export default function RulesPage() {
  const { t, lang } = useT();
  const content = rulesFor(lang);
  const [open, setOpen] = useState<string | null>(null);

  return (
    /*
      The same p-4 sm:p-6 lg:p-8 every other screen in the shell wears. The
      shell's <main> carries no padding of its own — each page owns its own
      inset — and this one shipped without any, so its heading sat flush
      against the top and the left edge while every neighbour stood off them.
    */
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow={t('arena.rules.eyebrow')} title={content.title} />

      <div className="mb-8 flex items-start gap-4 rounded-lg border border-white/[0.07] bg-arena-800 p-5">
        <BookOpenIcon className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
        <p className="text-sm leading-relaxed text-arena-100">
          {content.intro}
        </p>
      </div>

      {/* ===================================================== the figures */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {content.facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-lg border border-white/[0.07] bg-arena-800 p-4 text-center"
          >
            <div className="text-lg font-bold text-gold tabular-nums">
              {fact.value}
            </div>
            <div className="mt-1 text-[10px] tracking-wider text-arena-300 uppercase">
              {fact.label}
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================== the sections */}
      <div className="space-y-4">
        {content.sections.map((section) => {
          const expanded = open === section.id;
          return (
            <section
              key={section.id}
              id={section.id}
              className="rounded-lg border border-white/[0.07] bg-arena-800"
            >
              {/*
                One control, two behaviours by viewport. Below sm it is a
                real disclosure button; from sm up the body is always shown
                and this is just the heading, so the button stops claiming to
                toggle anything that moves.
              */}
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : section.id)}
                aria-expanded={expanded}
                aria-controls={`${section.id}-body`}
                className="flex w-full cursor-pointer items-center gap-3 p-5 text-left focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:cursor-default"
              >
                <span className="text-gold" aria-hidden="true">
                  {SECTION_ICON[section.id] ?? (
                    <BookOpenIcon className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold tracking-wide text-white">
                    {section.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-arena-300">
                    {section.lead}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-arena-300 transition-transform sm:hidden ${
                    expanded ? 'rotate-45' : ''
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>

              <div
                id={`${section.id}-body`}
                className={`space-y-4 border-t border-white/[0.07] p-5 ${
                  expanded ? 'block' : 'hidden sm:block'
                }`}
              >
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/rooms"
          className="rounded-lg bg-gold px-8 py-4 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.rules.play')}
        </Link>
      </div>
    </div>
  );
}
