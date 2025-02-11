import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { logger } from './logger';

interface BaseLink {
  url: string;
  status: number;
  timestamp: Date;
  responseTime?: number;
}

export interface BrokenLink extends BaseLink {
  error: string;
  errorCode: string;
  errorDetails?: any;
  originPage: string;
}

interface ScanStats {
  totalLinksScanned: number;
  workingLinks: number;
  brokenLinks: number;
}

export interface ScanResult {
  pageUrl: string;
  brokenLinks: BrokenLink[];
  foundLinks: Set<string>;
  stats: ScanStats;
}

class LinkChecker {
  private stats: ScanStats = {
    totalLinksScanned: 0,
    workingLinks: 0,
    brokenLinks: 0,
  };

  constructor() {}

  public async scanPage(pageUrl: string): Promise<ScanResult> {
    let foundLinks = new Set<string>();
    let brokenLinks: BrokenLink[] = [];

    try {
      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const $ = cheerio.load(response.data);
      const baseUrl = new URL(pageUrl);

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, pageUrl).toString();
            if (new URL(absoluteUrl).hostname === baseUrl.hostname) {
              foundLinks.add(absoluteUrl);
            }
          } catch (e) {
            logger.info(`Invalid URL found: ${href}`);
          }
        }
      });

      logger.info(`Found ${foundLinks.size} links on ${pageUrl}`);

      for (const link of foundLinks) {
        this.stats.totalLinksScanned++;

        try {
          const startTime = Date.now();
          const response = await axios.get(link, {
            timeout: 10000,
            validateStatus: function (status) {
              return true;
            },
          });
          const responseTime = Date.now() - startTime;

          if (response.status < 400) {
            this.stats.workingLinks++;
            logger.info(`Link OK: ${link} -> ${response.status} (${responseTime}ms)`);
          } else {
            this.stats.brokenLinks++;
            brokenLinks.push({
              url: link,
              status: response.status,
              responseTime: responseTime,
              errorCode: `${response.status}`,
              error: response.statusText || `HTTP Error ${response.status}`,
              timestamp: new Date(),
              originPage: pageUrl,
            });
            logger.info(`Broken link: ${link} -> ${response.status} (${response.statusText})`);
          }
        } catch (error) {
          this.stats.brokenLinks++;
          const brokenLink: BrokenLink = {
            url: link,
            status: 0,
            timestamp: new Date(),
            errorCode: 'UNKNOWN_ERROR',
            error: 'Unknown error',
            originPage: pageUrl,
          };

          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            brokenLink.status = axiosError.response?.status || 0;
            brokenLink.errorCode = axiosError.code || 'NETWORK_ERROR';
            brokenLink.error = axiosError.message;
            if (axiosError.code === 'ECONNABORTED') {
              brokenLink.errorCode = 'TIMEOUT';
              brokenLink.error = 'Request timed out';
            }
          } else if (error instanceof Error) {
            brokenLink.error = error.message;
          }

          brokenLinks.push(brokenLink);
          logger.info(`Broken link: ${link} -> ${brokenLink.error}`);
        }
      }

      // Log the scan result for the current page
      logger.info(`**************************************`);
      logger.info(`Scan result for ${pageUrl}:`);
      logger.info(`Links Found on current page: ${foundLinks.size}`);
      logger.info(`Working Links on current page: ${foundLinks.size - brokenLinks.length}`);
      logger.info(`Broken Links on current page: ${brokenLinks.length}`);

      return {
        pageUrl,
        brokenLinks,
        foundLinks,
        stats: this.stats,
      };
    } catch (error) {
      logger.info(`Failed to scan ${pageUrl}: ${error}`);
      throw error;
    }
  }
}

export default LinkChecker;
