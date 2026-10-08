"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  // collect headings - scoped to prose/main, auto-assign ids, dedup
  useEffect(() => {
    const collect = () => {
      const root =
        (document.querySelector(".prose-custom") as HTMLElement) ||
        (document.querySelector("main") as HTMLElement) ||
        document.body;

      const els = Array.from(
        root.querySelectorAll("h2, h3")
      ) as HTMLElement[];

      // fallback to h2-h3 only - h1 is page title, h4 rarely used
      const seen = new Map<string, number>();
      const items: TocItem[] = els
        .filter((el) => el.textContent?.trim())
        .map((el) => {
          let id = el.id;
          if (!id) {
            const base = slugify(el.textContent || "");
            const count = seen.get(base) || 0;
            id = count === 0 ? base : `${base}-${count}`;
            seen.set(base, count + 1);
            // assign back so scrollTo / observer works
            el.id = id;
          } else {
            // ensure unique if duplicate ids exist in DOM
            const count = seen.get(id) || 0;
            if (count > 0) {
              id = `${id}-${count}`;
              el.id = id;
            }
            seen.set(id, (seen.get(id) || 0) + 1);
          }
          return {
            id,
            text: (el.textContent || "").trim(),
            level: parseInt(el.tagName.charAt(1), 10),
          };
        });

      setHeadings(items);
      if (items[0]) setActiveId((prev) => prev || items[0].id);
    };

    // rAF ensures DOM after MDX render
    let raf = requestAnimationFrame(() => collect());

    // watch for next/navigation + dynamic content
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(collect);
    });
    const root =
      document.querySelector(".prose-custom") ||
      document.querySelector("main");
    if (root) mo.observe(root, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [pathname]);

  // active spy - IntersectionObserver + scroll fallback
  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    const visible = new Set<string>();

    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // pick topmost visible
        if (visible.size > 0) {
          const sorted = Array.from(visible).sort((a, b) => {
            const elA = document.getElementById(a);
            const elB = document.getElementById(b);
            if (!elA || !elB) return 0;
            return elA.getBoundingClientRect().top - elB.getBoundingClientRect().top;
          });
          setActiveId(sorted[0]);
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: [0, 0.1, 1] }
    );
    observerRef.current = observer;
    elements.forEach((el) => observer.observe(el));

    // scroll fallback for fast scroll / observer gaps
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        let current = headings[0]?.id || "";
        for (const h of headings) {
          const el = document.getElementById(h.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= 110) current = h.id;
          else break;
        }
        setActiveId((prev) => (visible.size === 0 ? current : prev));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [headings]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80; // header 64 + gap
    window.scrollTo({ top, behavior: "smooth" });
    // push hash without jump
    history.replaceState(null, "", `#${id}`);
  };

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <h4 className="sidebar-section !mb-0 !text-[0.68rem]">On this page</h4>
        </div>

        <ul className="space-y-0.5 text-[13px] leading-[1.4] relative">
          {/* subtle rail */}
          <span className="pointer-events-none absolute left-[5px] top-1 bottom-1 w-px bg-border-primary/60" />

          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const indent = heading.level === 3 ? "ml-4" : heading.level >= 4 ? "ml-8" : "";

            return (
              <li key={heading.id} className={indent}>
                <button
                  onClick={() => scrollTo(heading.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative w-full text-left flex items-start gap-2 py-1.5 pl-4 pr-2 rounded-md border-l-2 -ml-px transition-all duration-150
                    ${
                      isActive
                        ? "border-accent text-accent bg-accent-muted font-medium"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary hover:border-border-primary"
                    }`}
                >
                  <span
                    className={`mt-[6px] w-1 h-1 rounded-full shrink-0 transition-colors ${
                      isActive ? "bg-accent" : "bg-mauve-300 group-hover:bg-border-hover"
                    }`}
                  />
                  <span className="line-clamp-2">{heading.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
