"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Variant = "up" | "fade" | "scale" | "slide-l" | "slide-r" | "clip";

interface RevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  as?: "div" | "span" | "section" | "article" | "li" | "ul";
  className?: string;
  style?: CSSProperties;
}

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration,
  threshold = 0.12,
  once = true,
  as: Tag = "div",
  className = "",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) io.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const composed: CSSProperties = {
    ...(delay ? { animationDelay: `${delay}ms` } : null),
    ...(duration ? { animationDuration: `${duration}ms` } : null),
    ...style,
  };

  // Render via the requested intrinsic tag.
  const Element = Tag as unknown as keyof React.JSX.IntrinsicElements;
  return (
    <Element
      ref={ref as React.Ref<HTMLElement>}
      data-fx={variant === "up" ? undefined : variant}
      className={`fx-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={composed}
    >
      {children}
    </Element>
  );
}
