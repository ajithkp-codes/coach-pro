import * as React from "react";

/** CoachPro design-system components. Mount from `window.CoachPro`. */

export type Tone = "brand" | "ink" | "paper" | "current";
export type Status = "on-track" | "at-risk" | "off-track";
export type Trend = "up" | "down" | "flat";

export interface LogoProps {
  /** `lockup` (mark + wordmark), `stacked`, or `mark` only. Default `lockup`. */
  variant?: "lockup" | "stacked" | "mark";
  /** Mark height in px (wordmark scales from it). Default 32. */
  size?: number;
  /** Ink of the mark. Default `brand`. */
  tone?: Tone;
  title?: string;
  style?: React.CSSProperties;
}
export const Logo: React.FC<LogoProps>;
export const Mark: React.FC<{ size?: number; tone?: Tone; title?: string }>;

export interface ButtonProps {
  /** Default `primary`. `danger` is destructive only. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  full?: boolean;
  href?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}
export const Button: React.FC<ButtonProps>;

export interface BadgeProps {
  /** Client/plan state. Non-status chips use `brand`, `neutral`, `info`. */
  status?: Status | "brand" | "neutral" | "info";
  /** Show the status icon instead of the dot (recommended for status). */
  icon?: boolean;
  /** Override the default label text. */
  children?: React.ReactNode;
}
export const Badge: React.FC<BadgeProps>;

export interface AvatarProps {
  name?: string;
  src?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  /** Status dot overlay. */
  status?: "pos" | "warn" | "neg";
}
export const Avatar: React.FC<AvatarProps>;

export interface CardProps {
  title?: React.ReactNode;
  /** Right-aligned header slot (e.g. a Button or Badge). */
  action?: React.ReactNode;
  muted?: boolean;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}
export const Card: React.FC<CardProps>;

export interface FieldProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  hint?: string;
  /** Error message; replaces hint and reddens the control. */
  error?: string;
  disabled?: boolean;
  id?: string;
}
export const Field: React.FC<FieldProps>;

export interface StatTileProps {
  /** Uppercase mono label. */
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** Delta text, e.g. "+2.4%". */
  delta?: React.ReactNode;
  trend?: Trend;
  caption?: React.ReactNode;
}
export const StatTile: React.FC<StatTileProps>;

export interface ProgressRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  stroke?: number;
  /** Colors the arc by state; default brand. */
  status?: "pos" | "warn" | "neg";
  /** Center big text; defaults to `${value}%`. */
  num?: React.ReactNode;
  sublabel?: React.ReactNode;
  numSize?: number;
}
export const ProgressRing: React.FC<ProgressRingProps>;

export interface ClientRowProps {
  name: string;
  /** e.g. "Strength · Week 6". */
  meta?: string;
  src?: string;
  /** 0–100, shown as the primary metric. */
  adherence: number;
  /** Small series for the sparkline. */
  trend?: number[];
  status?: Status;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}
export const ClientRow: React.FC<ClientRowProps>;

export const Spark: React.FC<{ data: number[]; width?: number; height?: number; color?: string }>;
export const Delta: React.FC<{ trend?: Trend; children?: React.ReactNode }>;
