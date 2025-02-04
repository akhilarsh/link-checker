import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { logger } from './logger';

interface BrokenLink {
  url: string;
  status: number | string;
  error: string;
}

interface ScanStats {
  totalLinksScanned: number;
  workingLinks: number;
  brokenLinks: number;
}

class LinkChecker {
  private stats: ScanStats = {
    totalLinksScanned: 0,
    workingLinks: 0,
    brokenLinks: 0
  };

  constructor(
    private brokenLinks: BrokenLink[] = [] // List to store broken link details
  ) { }

  public async check(startUrl: string): Promise<ScanStats> {
    try {
      const response = await axios.get(startUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      const $ = cheerio.load(response.data);
      const links = new Set<string>();
      const baseUrl = new URL(startUrl);

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, startUrl).toString();
            if (new URL(absoluteUrl).hostname === baseUrl.hostname) {
              links.add(absoluteUrl);
            }
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });

      logger.info(`Found ${links.size} links on ${startUrl}`);

      for (const link of links) {
        this.stats.totalLinksScanned++;
        logger.info(`Checking link: ${link}`);

        try {
          const response = await axios.get(link, { timeout: 5000 });
          if (response.status < 400) {
            this.stats.workingLinks++;
            logger.info(`Link OK: -> ${response.status}`);
          } else {
            this.stats.brokenLinks++;
            logger.info(`Broken link: -> ${response.status}`);
            // Store broken link details
            this.brokenLinks.push({
              url: link,
              status: response.status,
              error: 'HTTP error status'
            });
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            this.stats.brokenLinks++;
            logger.info(`Broken link: ${link} -> Error (${error.message})`);
          }
        }
      }

      logger.info('\nScan Complete:');
      logger.info(`Total Links Scanned: ${this.stats.totalLinksScanned}`);
      logger.info(`Working Links Count: ${this.stats.workingLinks}`);
      logger.info(`Broken Links Count: ${this.stats.brokenLinks}`);
      logger.info(`Broken Links: ${this.brokenLinks}`)

      return this.stats;

    } catch (error) {
      logger.info(`Failed to scan ${startUrl}: ${error}`);
      throw error;
    }
  }
}

export default LinkChecker;
