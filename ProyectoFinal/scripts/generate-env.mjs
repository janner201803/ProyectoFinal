
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Faltan las credenciales en el archivo .env');
}

// Obtener la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Crear la ruta de destino
const environmentsDir = path.join(
  projectRoot,
  'src',
  'app',
  'environments'
);

// Crear la carpeta si no existe
fs.mkdirSync(environmentsDir, { recursive: true });

// Ruta completa del archivo
const outputPath = path.join(
  environmentsDir,
  'environment.ts'
);

const contenido = `
export const environment = {
  production: false,
  supabaseUrl: ${JSON.stringify(url)},
  supabaseKey: ${JSON.stringify(key)}
};
`;

// Generar archivo
fs.writeFileSync(outputPath, contenido, 'utf8');

console.log('Credenciales cargadas correctamente');
console.log('Archivo generado en:', outputPath);
