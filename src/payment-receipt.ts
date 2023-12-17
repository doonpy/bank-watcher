import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { PaymentReceiptRecord } from './types.ts';
import assert from 'assert';

export class PaymentReceipt {
  public static _instance: PaymentReceipt;

  private readonly _client: Client;
  private readonly _databaseId: string;
  private readonly _notificationUserId?: string;

  constructor() {
    assert(process.env.NOTION_DATABASE_ID, 'NOTION_DATABASE_ID is required');
    assert(process.env.NOTION_TOKEN, 'NOTION_TOKEN is required');
    this._client = new Client({
      auth: process.env.NOTION_TOKEN,
    });
    this._databaseId = process.env.NOTION_DATABASE_ID;
    this._notificationUserId = process.env.NOTION_NOTIFICATION_USER_ID;
  }

  public static getInstance(): PaymentReceipt {
    if (!this._instance) {
      this._instance = new PaymentReceipt();
    }

    return this._instance;
  }

  private async getLastAutomationItem() {
    const response = await this._client.databases.query({
      database_id: this._databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
      filter: { property: 'Note', rich_text: { contains: 'From automation' } },
    });
    if (response.results.length === 0) {
      throw new Error('No data in database');
    }

    return response.results[0] as PageObjectResponse;
  }

  public async getLastTransactionCreationTime(): Promise<Date> {
    const lastDataItem = await this.getLastAutomationItem();
    const bankMetadata = lastDataItem.properties['bankMetadata'];
    if (
      bankMetadata.type === 'rich_text' &&
      bankMetadata.rich_text[0]?.type === 'text' &&
      bankMetadata.rich_text[0]?.text?.content
    ) {
      return new Date(
        JSON.parse(bankMetadata.rich_text[0].text.content).creationTime
      );
    } else {
      throw new Error('Invalid date');
    }
  }

  public async create(item: Omit<PaymentReceiptRecord, 'id'>) {
    const result = await this._client.pages.create({
      parent: { database_id: this._databaseId },
      properties: {
        Name: {
          type: 'title',
          title: [{ type: 'text', text: { content: item.name } }],
        },
        Amount: { number: item.amount },
        Date: { date: { start: item.date } },
        Fund: { select: { name: item.fund } },
        Note: { rich_text: [{ text: { content: item.note } }] },
        bankMetadata: { rich_text: [{ text: { content: item.bankMetadata } }] },
      },
    });
    if (this._notificationUserId) {
      await this._client.comments.create({
        parent: { page_id: result.id },
        rich_text: [
          { mention: { user: { id: this._notificationUserId } } },
          { text: { content: '\nNew transaction from bank statement' } },
        ],
      });
    }
  }
}
