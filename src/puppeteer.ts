import puppeteer, { Browser, HTTPResponse, Page } from 'puppeteer';
import logger from './logger.ts';

export class Puppeteer {
  private static _instance: Puppeteer;

  private _page!: Page;

  constructor(private readonly _browser: Browser) {}

  public static async getInstance(): Promise<Puppeteer> {
    if (!this._instance) {
      const browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        // executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox'],
      });
      this._instance = new Puppeteer(browser);
    }

    return this._instance;
  }

  public async goTo(url: string): Promise<void> {
    logger.info(`Go to: ${url}`, { scope: 'Puppeteer' });
    await this._page.goto(url);
  }

  public async click(xpath: string): Promise<void> {
    logger.info(`Click: ${xpath}`, { scope: 'Puppeteer' });
    await this._page.waitForXPath(xpath);
    const [button] = await this._page.$x(xpath);
    await button.click();
  }

  public async input(xpath: string, value: string): Promise<void> {
    logger.info(`Input: ${xpath}`, { scope: 'Puppeteer' });
    await this._page.waitForXPath(xpath);
    const [input] = await this._page.$x(xpath);
    await input.type(value);
  }

  public async bindOnResponseEvent(
    handler: (res: HTTPResponse) => Promise<void> | void
  ): Promise<void> {
    logger.info(`Bind on response event`, { scope: 'Puppeteer' });
    this._page.on('response', handler);
  }

  public async waitForXPath(xpath: string): Promise<void> {
    logger.info(`Wait for xpath: ${xpath}`, { scope: 'Puppeteer' });
    await this._page.waitForXPath(xpath);
  }

  public async reload() {
    logger.info(`Reload`, { scope: 'Puppeteer' });
    await this._page.reload();
  }

  public async close() {
    logger.info(`Close`, { scope: 'Puppeteer' });
    await this._page.close();
  }

  public async termniate() {
    logger.info(`Terminate`, { scope: 'Puppeteer' });
    await this._browser.close();
  }

  public async start() {
    logger.info(`Start`, { scope: 'Puppeteer' });
    this._page = await this._browser.newPage();
  }
}
