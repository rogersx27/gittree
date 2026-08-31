import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // El backend vive aparte; el proxy evita cualquier configuracion de CORS
    proxy: { "/api": "http://127.0.0.1:5175" },
  },
  // @gittree/core se consume como fuente TypeScript enlazada desde el workspace,
  // asi que no debe pre-empaquetarse como dependencia externa
  optimizeDeps: { exclude: ["@gittree/core"] },
});
