import * as dotenv from 'dotenv';
import { logger } from './logger';
dotenv.config();

export function getBaseUrl() {
  if (!process.env.HOME_PAGE) {
    logger.error('HOME_PAGE environment variable is not set');
    process.exit(1);
  }
  return process.env.HOME_PAGE;
}

export function getMaxDepth() {
  if (!process.env.MAX_DEPTH) {
    logger.error('MAX_DEPTH environment variable is not set');
    return 1;
  }
  return parseInt(process.env.MAX_DEPTH);
}
