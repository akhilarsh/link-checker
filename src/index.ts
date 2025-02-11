import WebsiteLinkScanner from './scan-multiple-pages';
import { logger } from './logger';
import { getBaseUrl, getMaxDepth } from './config.utils';

async function main() {
  const scanner = new WebsiteLinkScanner();
  const startUrl = getBaseUrl();
  const maxDepth = getMaxDepth();

  try {
    logger.info(`Starting scan from: ${startUrl}`);
    logger.info(`Max depth: ${maxDepth}`);
    const result = await scanner.scan(startUrl, maxDepth);
    logger.info('Scan completed successfully');
  } catch (error) {
    logger.error(`Scan failed: ${error}`);
    process.exit(1);
  }
}

main();

export default main;

export { default as LinkChecker } from './scan-single-page';
export { default as WebsiteLinkScanner } from './scan-multiple-pages';
