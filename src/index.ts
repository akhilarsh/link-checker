import { logger } from './logger'
import SinglePage from './checkBrokenLinks';
import AllPages from './checkBrokenLinksRecursive'

async function main(url: string) {
  try {
    const checker = new SinglePage();
    const stats = await checker.check(url);
    return stats;
  } catch (error) {
    logger.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

if (require.main === module) {
  const startUrl = 'https://www.google.com/';
  main(startUrl).catch(error => {
    logger.error('Error:', error);
    process.exit(1);
  });
}

export default main;
