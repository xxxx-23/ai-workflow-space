import Dexie, { Table } from 'dexie';
import { Conversation } from '../types/chat';

export class ChatDatabase extends Dexie {
  conversations!: Table<Conversation, string>;

  constructor() {
    super('ChatDB');
    this.version(1).stores({
      conversations: 'id, updatedAt',
    });
  }
}

export const db = new ChatDatabase();
