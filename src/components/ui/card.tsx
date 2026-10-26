import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-white p-6 shadow-[var(--shadow-subtle)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: CardProps) {
  return (
    <h3
      className={`text-xl font-semibold tracking-tight text-[var(--stone-900)] ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }: CardProps) {
  return (
    <p className={`text-sm text-[var(--stone-600)] leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`text-[var(--stone-900)] ${className}`} {...props}>
      {children}
    </div>
  );
}
