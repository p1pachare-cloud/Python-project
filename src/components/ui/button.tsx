import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

  const sizeStyles = {
    sm: "h-9 px-3 text-xs rounded-[var(--radius-md)] min-h-[36px]",
    md: "h-11 px-5 text-sm rounded-[var(--radius-md)] min-h-[44px]", // 44px touch target (WCAG compliant)
    lg: "h-13 px-7 text-base rounded-[var(--radius-md)] min-h-[52px]",
  };

  /**
   * Verified WCAG 2.2 AA Contrast:
   * - Primary: #042F2E on #14B8A6 (5.81:1 - PASSES AA)
   * - Accent: #4C0519 on #FF6B5E (5.60:1 - PASSES AA)
   * - Secondary: #1C1917 on #F5F5F4 (15.5:1 - PASSES AAA)
   */
  const variantStyles = {
    primary:
      "bg-[var(--mint-500)] text-[var(--mint-950)] hover:bg-[var(--mint-600)] focus-visible:ring-[var(--mint-500)] shadow-[var(--shadow-subtle)] active:translate-y-px",
    secondary:
      "bg-[var(--stone-100)] text-[var(--stone-900)] border border-[var(--stone-200)] hover:bg-[var(--stone-200)] focus-visible:ring-[var(--stone-400)] active:translate-y-px",
    ghost:
      "bg-transparent text-[var(--stone-700)] hover:bg-[var(--stone-100)] hover:text-[var(--stone-900)] focus-visible:ring-[var(--stone-400)]",
    accent:
      "bg-[var(--coral-500)] text-[var(--coral-950)] hover:bg-[var(--coral-600)] focus-visible:ring-[var(--coral-500)] shadow-[var(--shadow-subtle)] active:translate-y-px",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
