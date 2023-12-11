import { Puppeteer } from './puppeteer.ts';
import assert from 'assert';
import { Transaction } from './types.ts';
import { HTTPResponse } from 'puppeteer';
import { PaymentReceipt } from './payment-receipt.ts';
import logger from './logger.ts';

export class Techcombank {
  private static _instance: Techcombank;

  private readonly _username: string;
  private readonly _password: string;

  constructor(
    private readonly _puppeteer: Puppeteer,
    private readonly _paymentReceipt: PaymentReceipt
  ) {
    assert(process.env.TCB_USERNAME, 'TCB_USERNAME is required');
    assert(process.env.TCB_PASSWORD, 'TCB_PASSWORD is required');
    this._username = process.env.TCB_USERNAME;
    this._password = process.env.TCB_PASSWORD;
  }

  public static async getInstance() {
    if (!this._instance) {
      const puppeteer = await Puppeteer.getInstance();
      const paymentReceipt = PaymentReceipt.getInstance();
      this._instance = new Techcombank(puppeteer, paymentReceipt);
    }

    return this._instance;
  }

  public async start() {
    logger.info('Start Techcombank watcher', { scope: 'Techcombank' });
    await this._puppeteer.start();
    await this._puppeteer.goTo('https://onlinebanking.techcombank.com.vn');
    await this.login();
    await this.bindTrackingEvent();
    // this.bindAutoReload();
  }

  public async close() {
    logger.info('Close Techcombank watcher', { scope: 'Techcombank' });
    await this._puppeteer.close();
  }

  private async login() {
    logger.info('-> Login', { scope: 'Techcombank' });

    const usernameInputXPath = '//*[@id="username"]';
    const passwordInputXPath = '//*[@id="password"]';
    const loginButtonXPath = '//*[@id="kc-login"]';
    await this._puppeteer.input(usernameInputXPath, this._username);
    await this._puppeteer.input(passwordInputXPath, this._password);
    await this._puppeteer.click(loginButtonXPath);
  }

  private async bindTrackingEvent() {
    const dashboardXPath =
      '/html/body/tcb-root/tcb-layout/div[1]/div/div[2]/div/tcb-dashboard/div[2]';
    await this._puppeteer.waitForXPath(dashboardXPath);
    await this._puppeteer.bindOnResponseEvent(
      this.onResponseHandler.bind(this)
    );
    await this._puppeteer.goTo(
      'https://onlinebanking.techcombank.com.vn/dashboard/feed'
    );
  }

  private handleDescription(description: string) {
    const regex =
      /Giao dich thanh toan\/Purchase - So The\/Card No:...[0-9]{4}\s|GD THE (TREN INTERNET|QUA POS) SO THE [0-9.]+ NGAY [\/0-9]+ TAI\s/gi;

    return description.replace(regex, '').trim();
  }

  private async onResponseHandler(res: HTTPResponse) {
    if (
      res
        .url()
        .startsWith(
          'https://identity-tcb.techcombank.com.vn/auth/realms/backbase/protocol/openid-connect/auth'
        )
    ) {
      await this.restart();
      return;
    }

    if (
      !res
        .url()
        .startsWith(
          'https://onlinebanking.techcombank.com.vn/api/transaction-manager/client-api/v2/transactions'
        )
    ) {
      return;
    }

    const transactions = (await res.json()) as Transaction[];
    if (transactions.length === 0) {
      return;
    }

    const lastTransactionCreationTime =
      await this._paymentReceipt.getLastTransactionCreationTime();
    logger.info(
      `Last transaction creation time: ${lastTransactionCreationTime.toISOString()}`,
      { scope: 'Techcombank' }
    );
    const newTransactions = transactions.filter(
      (t) =>
        new Date(t.creationTime).getTime() >
        lastTransactionCreationTime.getTime()
    );
    if (newTransactions.length > 0) {
      await Promise.all(
        newTransactions.map((txn) => this.processNewTransaction(txn))
      );
    } else {
      logger.info('No new transaction', { scope: 'Techcombank' });
    }

    await this._puppeteer.terminate();
  }

  private processNewTransaction(txn: Transaction) {
    logger.info('Process new transaction', {
      scope: 'Techcombank',
      type: txn.creditDebitIndicator,
      amount: txn.transactionAmountCurrency.amount,
      description: txn.description,
      creationTime: txn.creationTime,
    });

    const name = this.handleDescription(txn.description);
    const type = txn.creditDebitIndicator === 'DBIT' ? 'Outcome' : 'Income';
    const amount = parseInt(txn.transactionAmountCurrency.amount);
    const note = 'From automation';
    const bankMetadata = JSON.stringify(txn);

    return this._paymentReceipt.create({
      name,
      type,
      amount: type === 'Income' ? amount : -amount,
      fund: 'Necessary',
      date: txn.creationTime,
      note,
      bankMetadata,
    });
  }

  private bindAutoReload() {
    const seconds = process.env.RELOAD_INTERVAL_SECONDS || 60;
    setInterval(async () => {
      await this._puppeteer.reload();
    }, 1000 * +seconds);
  }

  public async restart() {
    await this.close();
    await this.start();
  }
}
