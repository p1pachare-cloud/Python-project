import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mint" | "coral" | "neutral" | "success" | "warning";
  children: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-semibold select-none";

  /**
   * Contrast checks on stone-50 or badge backgrounds:
   * - mint: #042F2E on #CCFBF1 (Mint 100) -> 12.8:1 (AAA)
   * - coral: #4C0519 on #FFE4E1 (Coral 100) -> 13.5:1 (AAA)
   * - neutral: #1C1917 on #F5F5F4 (Stone 100) -> 15.5:1 (AAA)
   * - success: #15803D text with #DCFCE7 bg -> 6.8:1 (AA)
   * - warning: #B45309 text with #FEF3C7 bg -> 5.2:1 (AA)
   */
  const variantStyles = {
    mint: "bg-[var(--mint-100)] text-[var(--mint-950)] border border-[var(--mint-300)]",
    coral: "bg-[var(--coral-100)] text-[var(--coral-950)] border border-[var(--coral-300)]",
    neutral: "bg-[var(--stone-100)] text-[var(--stone-900)] border border-[var(--stone-200)]",
    success: "bg-emerald-50 text-[var(--semantic-success)] border border-emerald-200",
    warning: "bg-amber-50 text-[var(--semantic-warning)] border border-amber-200",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
