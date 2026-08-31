import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// La misma variable que lee el backend, para que ambos lados no puedan
// discrepar sobre donde vive la API
const API_PORT = process.env["GITTREE_API_PORT"] ?? "5175";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // El backend vive aparte; el proxy evita cualquier configuracion de CORS
    proxy: { "/api": `http://127.0.0.1:${API_PORT}` },
  },
  // @gittree/core se consume como fuente TypeScript enlazada desde el workspace,
  // asi que no debe pre-empaquetarse como dependencia externa. Cada subruta se
  // excluye aparte: Vite resuelve el pre-bundling por especificador, no por paquete
  optimizeDeps: {
    exclude: [
      "@gittree/core",
      "@gittree/core/api",
      "@gittree/core/collection",
      "@gittree/core/common",
      "@gittree/core/commit",
      "@gittree/core/layout",
      "@gittree/core/ref",
      "@gittree/core/repository",
    ],
  },
});
