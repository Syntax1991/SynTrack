import { useEffect, useRef } from "react";

type IndeterminateCheckboxProps = {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  "aria-label"?: string;
  disabled?: boolean;
};

/*
 * HTML checkboxes have no `indeterminate` attribute - it can only be
 * set imperatively on the DOM node, hence the ref/effect. Used for
 * "select all visible" headers and tri-state (NONE/SOME/ALL) tag rows.
 */
export function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  ...rest
}: IndeterminateCheckboxProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate =
        indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      ref={inputRef}
      type="checkbox"
      {...rest}
    />
  );
}
