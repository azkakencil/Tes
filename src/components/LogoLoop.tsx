import "./LogoLoop.css";

type LogoItem = string | { text: string };

type LogoLoopProps = {
  logos: LogoItem[];
  speed?: number;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  className?: string;
};

export default function LogoLoop({
  logos,
  speed = 120,
  logoHeight = 28,
  gap = 32,
  pauseOnHover = true,
  fadeOut = true,
  fadeOutColor = "#050507",
  className = "",
}: LogoLoopProps) {
  const items = [...logos, ...logos, ...logos, ...logos];
  const duration = Math.max(14, (logos.length * 180) / speed);
  return (
    <div className={`logo-loop ${fadeOut ? "fade" : ""} ${className}`} style={{ "--duration": `${duration}s`, "--logo-height": `${logoHeight}px`, "--gap": `${gap}px`, "--fade-color": fadeOutColor } as React.CSSProperties}>
      <div className={`logo-loop-track ${pauseOnHover ? "pause-on-hover" : ""}`}>
        {items.map((logo, index) => (
          <span className="logo-loop-item" key={index}>{typeof logo === "string" ? logo : logo.text}</span>
        ))}
      </div>
    </div>
  );
}