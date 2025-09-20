import { customAlphabet } from 'nanoid';
import { codes } from '@aimpact/agents-api/data/model';
import { ErrorGenerator } from '@aimpact/agents-api/business/errors';

const GROUPS = ['assignment', 'project', 'classroom', 'section', 'organization'];

export /*bundle*/ abstract class Codes {
	static identifier(entity: string) {
		if (entity === 'assignment') return `A`;
		else if (entity === 'classroom') return `C`;
		else if (entity === 'organization') return `O`;
		else if (entity === 'section') return `S`;
		else if (entity === 'project') return `P`;
		else throw ErrorGenerator.entityNotValid(entity);
	}

	static async generateCode(entity: string) {
		if (!GROUPS.includes(entity)) return { error: ErrorGenerator.entityNotValid(entity) };

		const CUSTOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		const nano = customAlphabet(CUSTOM_ALPHABET, 6);
		let code = `${this.identifier(entity)}${nano()}`;

		let response = await codes.data({ id: `${entity}.${code}` });
		if (response.error) return { error: response.error };
		if (response.data.exists) {
			do {
				code = `${this.identifier(entity)}${nano()}`;
				response = await codes.data({ id: `${entity}.${code}` });
			} while (response.data.exists);
		}

		return { code: <string>code };
	}
}
