import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtIDR(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID")
}
