import { ItemBase } from './base';
import { InputTextContentType, InputAudioContentType } from '../ConversationTypes';

export class UserItem extends ItemBase {
	constructor(id: string, status: string, content: (InputTextContentType | InputAudioContentType)[]) {
		super(id, 'message', 'user', status, content);
	}
}
