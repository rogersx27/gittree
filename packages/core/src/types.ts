// Contratos compartidos por los tres paquetes. Una sola definicion: server y web
// importan de aqui, nunca redeclaran.

// --- Lo que sale de git, sin interpretar ---

// Autor o committer de un commit
export interface Person {
  readonly name: string;
  readonly email: string;
}

// Clasificacion de una ref segun el prefijo que emite git con --decorate=full
export type RefKind = "local" | "remote" | "tag" | "head";

// Una ref apuntando a un commit. isCheckedOut solo es true para la rama de HEAD
export interface Ref {
  readonly kind: RefKind;
  readonly name: string;
  readonly isCheckedOut: boolean;
}

// Un commit tal y como lo devuelve git log, ya parseado pero sin posicionar
export interface RawCommit {
  readonly hash: string;
  readonly parents: readonly string[];
  readonly refs: readonly Ref[];
  readonly author: Person;
  readonly authoredAt: string;
  readonly subject: string;
}

// --- Lo que produce el motor de layout ---

// Un commit ya posicionado en la rejilla del grafo
export interface CommitNode {
  readonly hash: string;
  readonly row: number;
  readonly lane: number;
  readonly colorIndex: number;
}

// Forma de una arista, que decide como se traza:
//   straight - hijo y padre comparten lane
//   branch   - el padre vive en un lane distinto (la rama se abrio aqui)
//   merge    - arista hacia un segundo padre o posterior
export type EdgeKind = "straight" | "branch" | "merge";

// Como se conecta un commit con uno de sus padres. toRow es null cuando el padre
// no esta en el conjunto cargado (clon shallow o limite alcanzado): la arista se
// dibuja saliendo por abajo, sin destino
export interface LaneEdge {
  readonly fromRow: number;
  readonly fromLane: number;
  readonly toRow: number | null;
  readonly toLane: number;
  readonly colorIndex: number;
  readonly kind: EdgeKind;
}

// Resultado completo del engine: puro, serializable y comparable en un test
export interface GraphLayout {
  readonly nodes: readonly CommitNode[];
  readonly edges: readonly LaneEdge[];
  readonly laneCount: number;
  readonly rowCount: number;
}

// --- Detalle bajo demanda ---

export type ChangeStatus =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "typeChanged";

// Un archivo tocado por un commit. previousPath solo existe en rename y copy
export interface ChangedFile {
  readonly status: ChangeStatus;
  readonly path: string;
  readonly previousPath?: string;
}

export interface CommitDetail {
  readonly hash: string;
  readonly parents: readonly string[];
  readonly author: Person;
  readonly authoredAt: string;
  readonly committer: Person;
  readonly committedAt: string;
  readonly subject: string;
  readonly body: string;
  readonly isMerge: boolean;
  readonly files: readonly ChangedFile[];
}

// --- Contrato HTTP ---

// commits[i] y layout.nodes[i] describen el mismo commit: van alineados por
// indice, para que el cliente no tenga que hacer un join por hash
export interface GraphResponse {
  readonly repoPath: string;
  readonly commits: readonly RawCommit[];
  readonly layout: GraphLayout;
  // true si se alcanzo el limite y el historial esta truncado
  readonly truncated: boolean;
}

// Motivos por los que una ruta no sirve como repositorio
export type RepoErrorCode =
  | "NOT_FOUND"
  | "NOT_A_REPO"
  | "EMPTY_REPO"
  | "GIT_MISSING";

export type ApiErrorCode = RepoErrorCode | "BAD_REQUEST" | "COMMIT_NOT_FOUND";

// Los errores viajan siempre con esta forma, nunca como excepcion sin estructura
export interface ApiError {
  readonly code: ApiErrorCode;
  readonly message: string;
}
