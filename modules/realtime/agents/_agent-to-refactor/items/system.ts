import { ItemBase } from './base';
import { InputTextContentType } from '../ConversationTypes';

export class SystemItem extends ItemBase {
	constructor(id: string, status: string, content: InputTextContentType[]) {
		super(id, 'message', 'system', status, content);
	}
}
