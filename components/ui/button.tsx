import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const raised =
  "pixel-bevel active:not-aria-[haspopup]:translate-y-[2px] active:not-aria-[haspopup]:pixel-inset"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center border-0 bg-clip-padding font-sans text-sm font-semibold whitespace-nowrap outline-none select-none text-shadow-pixel transition-[filter,transform] duration-75 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 disabled:grayscale aria-invalid:outline-2 aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: cn(raised, "bg-primary text-white"),
        outline: cn(
          raised,
          "bg-secondary text-secondary-foreground aria-expanded:pixel-inset"
        ),
        secondary: cn(
          raised,
          "bg-secondary text-secondary-foreground aria-expanded:pixel-inset"
        ),
        gold: cn(raised, "bg-gold text-gold-foreground text-shadow-none"),
        ghost:
          "bg-transparent text-foreground text-shadow-none hover:bg-accent hover:pixel-bevel aria-expanded:bg-accent aria-expanded:pixel-inset",
        destructive: cn(raised, "bg-destructive text-white"),
        link: "bg-transparent text-gold text-shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2 text-xs [--pixel:2px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.85rem] [--pixel:2px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-14 gap-3 px-6 font-display text-xs tracking-wide sm:text-sm [--pixel:4px] [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9",
        "icon-xs": "size-6 [--pixel:2px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [--pixel:2px]",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
