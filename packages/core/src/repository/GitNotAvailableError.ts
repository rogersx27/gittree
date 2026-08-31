// git no esta en el PATH: es distinto de que el comando falle, y el usuario
// necesita saberlo para arreglarlo
export class GitNotAvailableError extends Error {
  constructor() {
    super("No se encuentra el ejecutable de git en el PATH del sistema.");
    this.name = "GitNotAvailableError";
  }
}
