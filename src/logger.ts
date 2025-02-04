import { format } from 'date-fns';
import filenamify from 'filenamify';
import fs from 'fs';
import { pino } from 'pino';

const TAG = process.env.TAG;
const LOGS_FOLDER = 'logs';
const LOGS_FILE_NAME = format(new Date(), 'dd-MM-yyyy HH.mm.ss');
const LOG_TIME_STAMP = 'UTC:yyyy-mm-dd HH:MM:ss.l o';
const LOG_DESTINATION = TAG
  ? `${LOGS_FOLDER}/${LOGS_FILE_NAME}-${TAG}.log`
  : `${LOGS_FOLDER}/${LOGS_FILE_NAME}.log`;

const redact = ['secrets'];

export function frame(text: string) {
  const min_stars = 80;
  const borderLength = Math.max(...text.split('\n').map((line) => line.length), min_stars) + 4;
  const stars = '*'.repeat(borderLength);
  const stars_line = `* ${stars}`;
  return `\n${stars_line}\n* ${text.replace(/\n/g, '\n* ')}\n${stars_line}`;
}

function createLogDirectory() {
  if (!fs.existsSync(LOGS_FOLDER)) {
    fs.mkdirSync(LOGS_FOLDER);
  }
}

class Logger {
  logger!: pino.Logger;
  context_name!: string;

  constructor() {
    this.updateLogger();
  }

  updateLogger() {
    this.logger = pino({
      transport: {
        targets: [
          {
            level: 'trace',
            target: 'pino-pretty',
            options: {
              destination: `${LOGS_FOLDER}/${this.context_name || 'context'}.log`,
              colorize: false,
              translateTime: LOG_TIME_STAMP,
            },
          },
          {
            level: 'trace',
            target: 'pino-pretty',
            options: {
              destination: LOG_DESTINATION,
              colorize: false,
              translateTime: LOG_TIME_STAMP,
            },
          },
          {
            level: 'info',
            target: 'pino-pretty',
            options: { destination: 1, translateTime: LOG_TIME_STAMP },
          },
        ],
      },
      redact: redact,
    });
    this.logger.level = 'trace';
  }

  updateContext(name: string) {
    this.logger.flush();
    this.context_name = filenamify(name, { replacement: '-' });
    this.updateLogger();
  }

  child() {
    return this.logger.child.apply(this.logger, arguments);
  }

  debug(_?: any, __?: string) {
    this.logger.debug.apply(this.logger, arguments);
  }

  info(_?: any, __?: string) {
    this.logger.info.apply(this.logger, arguments);
  }

  warn(_?: any, __?: string) {
    this.logger.warn.apply(this.logger, arguments);
  }

  error(_?: any, __?: string) {
    this.logger.error.apply(this.logger, arguments);
  }
}

export const logger = new Logger();
createLogDirectory();
