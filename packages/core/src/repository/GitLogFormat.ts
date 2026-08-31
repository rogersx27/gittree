// Formatos con los que se le pide a git su salida. Viven en un solo sitio porque
// cada parser depende del orden exacto de estos campos: tener el formato lejos
// del parseo es la forma mas facil de que dejen de cuadrar sin que nadie lo note.
export class GitLogFormat {
  // Utilidad sin estado: no se instancia
  private constructor() {}

  // Separador de campos: US (unit separator). Ni el, ni el NUL que separa
  // registros, pueden aparecer dentro de un mensaje de commit
  static readonly UNIT = "\x1f";

  // hash, padres, refs, autor, email, fecha ISO, asunto
  static readonly GRAPH: string = ["%H", "%P", "%D", "%an", "%ae", "%aI", "%s"].join("%x1f");

  // Igual, mas committer y cuerpo. %b va el ultimo porque contiene saltos de linea
  static readonly DETAIL: string = [
    "%H",
    "%P",
    "%an",
    "%ae",
    "%aI",
    "%cn",
    "%ce",
    "%cI",
    "%s",
    "%b",
  ].join("%x1f");
}
