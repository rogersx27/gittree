import Fastify from "fastify";
import { registerRoutes } from "./routes";

// Variable propia, no PORT a secas: en un arranque de dos servidores hay
// herramientas que inyectan PORT para el servidor de desarrollo del frontend,
// y el backend acabaria robandole el puerto
const PORT = Number(process.env["GITTREE_API_PORT"] ?? 5175);

// Escucha solo en loopback: GitTree lee repositorios del disco local y no debe
// quedar expuesto a la red por accidente
const HOST = process.env["HOST"] ?? "127.0.0.1";

const app = Fastify({ logger: { level: "warn" } });

registerRoutes(app);

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`GitTree API escuchando en http://${HOST}:${PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
