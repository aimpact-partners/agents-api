import { tool } from '@openai/agents';
import { z } from 'zod';
import { Tickets } from '@aimpact/agents-api/msp/business/tickets';

export const createSupportTicket = tool({
	name: 'createSupportTicket',
	description:
		'Creates a support ticket with the provided structured context. Use when guidance is not helpful, execution fails, or request is out of scope.',
	parameters: z.object({
		title: z.string().min(1).describe('Short, specific ticket title.'),
		description: z.string().min(1).describe('1-2 lines describing what was attempted and what failed.')
	}),
	async execute(
		{ title, description }: { title: string; description: string },
		toolContext?: { context?: Record<string, any>; actor?: { id?: string | null } }
	) {
		try {
			const ctx =
				toolContext?.context && Object.keys(toolContext.context).length !== 0 ? toolContext.context : undefined;
			const response = await Tickets.create({ title, description }, ctx.user);
			if (response.error) {
				return {
					status: 'error',
					code: 'UNKNOWN_RESPONSE',
					message: 'Ticket create returned no ticketId.'
				};
			}
			return { status: 'created', ticketId: response.data.id };
		} catch (error: any) {
			const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
			return {
				status: 'error',
				code: 'TICKET_CREATE_FAILED',
				message: `Failed to create support ticket: ${errorMessage}`
			};
		}
	}
});
