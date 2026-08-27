import type { ReactNode, MouseEventHandler } from "react";
import {
  MdFilledIconButtonEl,
  MdFilledTonalIconButtonEl,
  MdOutlinedIconButtonEl,
  MdIconButtonEl,
} from "./elements";

export type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";

const VARIANT_EL = {
  standard: MdIconButtonEl,
  filled: MdFilledIconButtonEl,
  tonal: MdFilledTonalIconButtonEl,
  outlined: MdOutlinedIconButtonEl,
};

export function IconButton({
  variant = "standard",
  children,
  className,
  disabled,
  onClick,
  toggle,
  selected,
  ariaLabel,
  title,
  id,
  tabIndex,
}: {
  variant?: IconButtonVariant;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Two-state toggle icon button (e.g. favorite/bookmark). */
  toggle?: boolean;
  selected?: boolean;
  ariaLabel?: string;
  title?: string;
  id?: string;
  tabIndex?: number;
}) {
  const Comp = VARIANT_EL[variant];
  return (
    <Comp
      disabled={disabled}
      onClick={onClick}
      toggle={toggle}
      selected={selected}
      className={className}
      id={id}
      aria-label={ariaLabel || title}
      title={title}
      tabIndex={tabIndex}
    >
      {children}
    </Comp>
  );
}
