import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-[color,background-color,border-color,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:brightness-95",
  {
    variants: {
      variant: {
        primary: "bg-navy text-paper hover:bg-navy-deep",
        invert: "bg-paper text-navy hover:bg-paper-2",
        outline:
          "border border-navy/25 bg-transparent text-navy hover:border-navy hover:bg-navy hover:text-paper",
        ghost: "bg-transparent text-navy hover:bg-navy/5",
        brass:
          "border border-brass-soft/55 bg-transparent text-brass-soft hover:bg-brass-soft hover:text-navy",
      },
      size: {
        sm: "h-10 px-4 text-sm rounded-sm",
        md: "h-11 px-5 text-sm rounded-sm",
        lg: "h-12 px-6 text-base rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
