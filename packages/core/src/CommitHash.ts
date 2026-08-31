import type { Brand } from "./Brand";

// Un hash tal y como lo emite git: hexadecimal en minuscula. Se admite la forma
// abreviada, que git resuelve igual, y hasta 64 caracteres para cubrir SHA-256
const HASH_PATTERN = /^[0-9a-f]{4,64}$/;

// Hash de un commit.
//
// Va marcado porque el tipo es aqui la barrera de seguridad, no un adorno:
// readCommitDetail entrega este valor a `git show` como argumento, y un string
// cualquiera puede no ser un hash sino una OPCION de git. `--output=fichero`
// hace que git escriba en disco, lo que rompe la garantia de que GitTree solo
// lee. Con la marca, un string suelto no compila en esa posicion: hay que pasar
// por parse, que es el unico sitio donde se comprueba la forma.
export type CommitHash = Brand<string, "CommitHash">;

const isCommitHash = (raw: string): raw is CommitHash => HASH_PATTERN.test(raw);

// Fabrica del tipo, en el mismo fichero que el: mantiene junta la marca con lo
// unico que sabe crearla
export const CommitHash: {
  readonly isValid: (raw: string) => raw is CommitHash;
  readonly parse: (raw: string) => CommitHash | null;
  readonly unchecked: (raw: string) => CommitHash;
} = {
  isValid: isCommitHash,

  // Devuelve null en vez de lanzar: quien llama esta en la frontera HTTP y
  // tiene que traducir el fallo a un ApiError con codigo, no a una excepcion
  parse: (raw: string): CommitHash | null =>
    isCommitHash(raw) ? raw : null,

  // Marca sin comprobar nada. Se llama asi para que avise en el punto de
  // llamada: los unicos usos legitimos son la salida de git (%H y %P son
  // hexadecimal por construccion, y revalidar 50.000 hashes solo cuesta tiempo)
  // y los fixtures de test. Todo lo que venga de fuera pasa por parse
  unchecked: (raw: string): CommitHash => raw as CommitHash,
};
