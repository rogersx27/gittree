// Punto de entrada publico del nucleo. Reexporta plano lo que atraviesa la
// frontera con server y web; cada paquete tiene ademas su propia subruta
// (@gittree/core/commit, /layout, /api...) declarada en package.json.
export type { ApiError, ApiErrorCode, GraphResponse, RepoErrorCode } from "./api";
export { MinHeap } from "./collection";
export type {
  Brand,
  BrandFactory,
  NonEmptyArray,
  ReadonlyNonEmptyArray,
} from "./common";
export {
  CommitGraph,
  CommitHash,
  type ChangedFile,
  type ChangeStatus,
  type CommitDetail,
  type Person,
  type RawCommit,
} from "./commit";
export {
  ColorIndex,
  GraphLayoutEngine,
  Lane,
  Row,
  type CommitNode,
  type EdgeKind,
  type GraphLayout,
  type LaneEdge,
} from "./layout";
export type { Ref, RefKind } from "./ref";
export {
  GitNotAvailableError,
  GitRepository,
  RefParser,
  type GitStatusCode,
} from "./repository";
