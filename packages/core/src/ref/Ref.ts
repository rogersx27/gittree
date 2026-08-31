import type { RefKind } from "./RefKind";

// Una ref apuntando a un commit. isCheckedOut solo es true para la rama de HEAD
export interface Ref {
  readonly kind: RefKind;
  readonly name: string;
  readonly isCheckedOut: boolean;
}
