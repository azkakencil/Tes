import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ScrollFloat.css";

gsap.registerPlugin(ScrollTrigger);

type ScrollFloatProps = {
  children: string;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
};

export default function ScrollFloat({
  children,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "back.inOut(2)",
  scrollStart = "top bottom-=10%",
  scrollEnd = "bottom center",
  stagger = 0.03,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const splitText = useMemo(
    () => children.split("").map((char, index) => <span className="char" key={index}>{char === " " ? "\u00A0" : char}</span>),
    [children],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chars = el.querySelectorAll(".char");
    const tween = gsap.fromTo(chars, { opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: "50% 0%" }, {
      duration: animationDuration,
      ease,
      opacity: 1,
      yPercent: 0,
      scaleY: 1,
      scaleX: 1,
      stagger,
      scrollTrigger: { trigger: el, start: scrollStart, end: scrollEnd, scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [animationDuration, ease, scrollEnd, scrollStart, stagger]);

  return <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}><span className={`scroll-float-text ${textClassName}`}>{splitText}</span></h2>;
}