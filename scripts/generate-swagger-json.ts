import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../src/config/swagger';

const outputPath = path.join(__dirname, '../swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf8');

console.log('swagger.json generated successfully at root!');
