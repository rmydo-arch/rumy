import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
export default defineConfig({ plugins: [basicSsl()], build: { target: 'es2022' } });
