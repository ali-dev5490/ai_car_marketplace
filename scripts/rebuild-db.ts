/**
 * Rebuild server/db.json from scraped JSON under ./data
 * (dubicars.json, dubizzle.json, olx_sahiwal.json + local images).
 */
import fs from 'fs';
import path from 'path';
import { buildScrapedCarDatabase } from '../server/scrapedDataGenerator';

const DB_FILE = path.join(process.cwd(), 'server', 'db.json');

const cars = buildScrapedCarDatabase();
fs.writeFileSync(DB_FILE, JSON.stringify(cars, null, 2), 'utf-8');
console.log(`Wrote ${cars.length} cars -> ${DB_FILE}`);
