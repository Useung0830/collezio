import type { ComponentProps, ReactNode } from "react";

type RadioOptionProps = Omit<
  ComponentProps<"input">,
  "type" | "children" | "className" | "name" | "value"
> & {
  children: ReactNode;
  name: string;
  value: string;
};

export default function RadioOption({ children, ...props }: RadioOptionProps) {
  return (
    <label className="relative inline-flex">
      <input {...props} type="radio" className="peer sr-only" />
      <span className="text-label-14 border-black-200 text-black-400 peer-checked:border-black-900 peer-checked:bg-black-900 peer-focus-visible:outline-black-900 rounded-full border bg-white px-4 py-2 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        {children}
      </span>
    </label>
  );
}
