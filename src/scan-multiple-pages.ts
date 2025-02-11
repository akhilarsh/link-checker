import LinkChecker, { ScanResult, BrokenLink } from './scan-single-page';
import { logger } from './logger';

interface ScanStats {
  totalPagesScanned: number;
  totalWorkingLinks: number;
  totalBrokenLinks: number;
  uniqueUrlsFound: number;
}

interface WebsiteScanResult {
  startingUrl: string;
  scannedPages: Map<string, ScanResult>;
  allBrokenLinks: BrokenLink[];
  stats: ScanStats;
}

class WebsiteLinkScanner {
  private visitedUrls: Set<string> = new Set();
  private urlsToProcess: string[] = [];
  private urlsInQueue: Set<string> = new Set();
  private linkChecker: LinkChecker;

  constructor() {
    this.linkChecker = new LinkChecker();
  }

  private queueNewUrls(urls: Set<string>) {
    for (const url of urls) {
      if (!this.visitedUrls.has(url) && !this.urlsInQueue.has(url)) {
        this.urlsToProcess.push(url);
        this.urlsInQueue.add(url);
      }
    }
  }

  public async scan(startUrl: string, maxDepth: number): Promise<WebsiteScanResult> {
    const scannedPages = new Map<string, ScanResult>();
    const allBrokenLinks: BrokenLink[] = [];
    const stats: ScanStats = {
      totalPagesScanned: 0,
      totalWorkingLinks: 0,
      totalBrokenLinks: 0,
      uniqueUrlsFound: 0,
    };

    // Queue initial URL
    this.queueNewUrls(new Set([startUrl]));
    let currentDepth = 0;

    // Process URLs breadth-first, level by level
    while (currentDepth < maxDepth) {
      const urlsAtCurrentDepth = [...this.urlsToProcess];
      this.urlsToProcess = []; // Clear for next depth level

      logger.info(
        `\nProcessing depth ${currentDepth} - URLs to scan: ${urlsAtCurrentDepth.length}`,
      );

      // Process all URLs at current depth
      for (const currentUrl of urlsAtCurrentDepth) {
        this.urlsInQueue.delete(currentUrl);

        if (!this.visitedUrls.has(currentUrl)) {
          logger.info(`\nScanning page: ${currentUrl}`);

          try {
            const scanResult = await this.linkChecker.scanPage(currentUrl);

            // Update stats
            stats.totalPagesScanned++;
            stats.totalWorkingLinks += scanResult.stats.workingLinks;
            stats.totalBrokenLinks += scanResult.stats.brokenLinks;

            // Store results
            scannedPages.set(currentUrl, scanResult);

            // Log the scan result for the current page
            logger.info(`**************************************`);
            logger.info(`Total Working Links: ${scanResult.stats.workingLinks}`);
            logger.info(`Total Broken Links: ${scanResult.stats.brokenLinks}`);
            logger.info(`**************************************`);

            if (scanResult.stats.brokenLinks > 0) {
              scanResult.brokenLinks.forEach((link) => {
                logger.info(`  ${link.url} - Error: ${link.errorCode}, ${link.error}`);
                allBrokenLinks.push(link);
              });
            }

            // Queue new URLs for next depth level
            this.queueNewUrls(scanResult.foundLinks);
            this.visitedUrls.add(currentUrl);
          } catch (error) {
            logger.info(`Error scanning ${currentUrl}: ${error}`);
          }
        }
      }

      currentDepth++;
      logger.info(
        `\nCompleted depth ${currentDepth - 1} - Scanned ${this.urlsToProcess.length} URLs`,
      );
    }

    // Add final summary in table format
    if (allBrokenLinks.length > 0) {
      logger.info('\nFinal Broken Links Summary:');
      logger.info(
        '╔═══════════════════════╦═══════════════════════╦══════════════╦═══════════════════════╗',
      );
      logger.info(
        '║       URL             ║     Origin Page       ║  Error Code  ║    Error Message      ║',
      );
      logger.info(
        '╠═══════════════════════╬═══════════════════════╬══════════════╬═══════════════════════╣',
      );
      allBrokenLinks.forEach((link) => {
        const url = link.url.padEnd(19);
        const originPage = link.originPage.padEnd(19);
        const errorCode = link.errorCode.padEnd(12);
        const error = link.error.padEnd(19);
        logger.info(`║ ${url}║ ${originPage}║ ${errorCode}║ ${error}║`);
      });
      logger.info(
        '╚═══════════════════════╩═══════════════════════╩══════════════╩═══════════════════════╝',
      );
    }

    // Add final statistics summary
    logger.info('\n************ Scan Statistics ************');
    logger.info(
      '╔════════════════════════════════════════════════════════════════════════════════════',
    );
    logger.info(`║ Total Pages Scanned: ${this.visitedUrls.size}`);
    logger.info(`║ Total Working Links: ${stats.totalWorkingLinks}`);
    logger.info(`║ Total Broken Links: ${stats.totalBrokenLinks}`);
    logger.info(`║ Total Unique URLs Found: ${stats.uniqueUrlsFound}`);
    logger.info(
      '╚════════════════════════════════════════════════════════════════════════════════════',
    );

    stats.uniqueUrlsFound = this.visitedUrls.size;

    return {
      startingUrl: startUrl,
      scannedPages,
      allBrokenLinks,
      stats,
    };
  }
}

export default WebsiteLinkScanner;
