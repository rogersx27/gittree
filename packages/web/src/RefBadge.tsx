import type { Ref } from "@gittree/core/ref";

// Simbolo por tipo de ref, para distinguirlas sin depender solo del color
const GLYPH: Readonly<Record<Ref["kind"], string>> = {
  local: "⌥",
  remote: "☁",
  tag: "⌗",
  head: "◉",
};

export const RefBadge = ({ refEntry }: { readonly refEntry: Ref }) => (
  <span
    className={`ref-badge ref-${refEntry.kind}${refEntry.isCheckedOut ? " ref-current" : ""}`}
    title={
      refEntry.isCheckedOut
        ? `${refEntry.name} (rama activa)`
        : refEntry.name
    }
  >
    <span className="ref-glyph">{GLYPH[refEntry.kind]}</span>
    {refEntry.name}
  </span>
);
