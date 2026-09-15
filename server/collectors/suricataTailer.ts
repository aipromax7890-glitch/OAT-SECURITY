import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { CONFIG } from '../config';
import { parseSuricataEve } from '../parsers/suricataParser';
import { processSecurityEvent } from '../detectors/threatDetector';

export class SuricataTailer {
  private filePath: string;
  private currentOffset: number = 0;
  private isWatching: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(filePath: string = CONFIG.SURICATA_EVE_PATH) {
    this.filePath = filePath;
  }

  public start() {
    console.log(`[Suricata Tailer] Monitoring eve.json path: ${this.filePath}`);
    
    // Ensure parent directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn(`[Suricata Tailer] Could not create directory ${dir}:`, err);
      }
    }

    // Initialize offset if file already exists
    if (fs.existsSync(this.filePath)) {
      try {
        const stats = fs.statSync(this.filePath);
        // Start tailing from current end of file or from start if file is small
        this.currentOffset = stats.size > 50000 ? stats.size : 0;
        console.log(`[Suricata Tailer] File found (${stats.size} bytes). Offset set to ${this.currentOffset}.`);
      } catch (e) {
        console.error('[Suricata Tailer] Error reading stats:', e);
      }
    } else {
      console.log(`[Suricata Tailer] ${this.filePath} does not exist yet. Waiting for Suricata sensor logs...`);
    }

    // Poll file size changes efficiently every 1000ms
    this.checkInterval = setInterval(() => {
      this.checkForNewLines();
    }, 1000);

    this.isWatching = true;
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isWatching = false;
    console.log('[Suricata Tailer] Stopped.');
  }

  private checkForNewLines() {
    if (!fs.existsSync(this.filePath)) return;

    try {
      const stats = fs.statSync(this.filePath);
      if (stats.size < this.currentOffset) {
        // File was rotated or truncated
        console.log('[Suricata Tailer] File truncated/rotated. Resetting offset to 0.');
        this.currentOffset = 0;
      }

      if (stats.size > this.currentOffset) {
        const stream = fs.createReadStream(this.filePath, {
          start: this.currentOffset,
          end: stats.size
        });

        const rl = readline.createInterface({
          input: stream,
          crlfDelay: Infinity
        });

        let bytesRead = 0;
        rl.on('line', (line) => {
          const trimmed = line.trim();
          if (trimmed.length > 0) {
            try {
              const parsed = parseSuricataEve(trimmed);
              if (parsed) {
                processSecurityEvent(parsed);
              }
            } catch (err) {
              console.warn('[Suricata Tailer] Error parsing eve line:', err);
            }
          }
        });

        rl.on('close', () => {
          this.currentOffset = stats.size;
        });
      }
    } catch (err) {
      console.error('[Suricata Tailer] Error checking file:', err);
    }
  }
}

export const suricataTailer = new SuricataTailer();
