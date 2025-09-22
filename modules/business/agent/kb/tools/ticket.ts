import { tool } from '@openai/agents';
import { z } from 'zod';
import { Tickets } from '@aimpact/agents-api/msp/business/tickets';

export const createSupportTicketTool = tool({
	name: 'createSupportTicketTool',
	description:
		'Creates a support ticket with the provided structured context. Use when guidance is not helpful, execution fails, or request is out of scope.',
	parameters: z.object({
		title: z.string().min(1).describe('Short, specific ticket title.'),
		summary: z.string().min(1).describe('1–2 lines describing what was attempted and what failed.'),
		component: z
			.enum(['Scheduling', 'Account/Auth', 'Avatar', 'Consultations', 'Other'])
			.describe('Affected product area.'),
		context: z
			.object({})
			.catchall(z.any())
			.describe('Minimal but useful interaction context (fields, errors, user role).'),
		attachments: z.array(z.string()).nullable().describe('Optional file URLs/ids.'),
		timestamp: z.string().describe('ISO 8601 timestamp for the event.')
	}),
	async execute(
		{
			title,
			summary,
			component,
			context,
			// attachments,
			timestamp
		}: {
			title: string;
			summary: string;
			component: 'Scheduling' | 'Account/Auth' | 'Avatar' | 'Consultations' | 'Other';
			context: Record<string, unknown>;
			attachments?: string[];
			timestamp: string;
		},
		toolContext?: { context?: Record<string, any>; actor?: { id?: string | null } }
	) {
		try {
			const ctx =
				toolContext?.context && Object.keys(toolContext.context).length !== 0 ? toolContext.context : undefined;

			// Optional: minimal timestamp check
			if (Number.isNaN(Date.parse(timestamp))) {
				return {
					status: 'error',
					code: 'INVALID_TIMESTAMP',
					message: 'Timestamp must be a valid ISO 8601 string.'
				};
			}

			const result = await Tickets.create({
				title,
				summary,
				component,
				context: { ...context, ...(ctx ?? {}), source: 'createSupportTicketTool' },
				attachments,
				timestamp,
				actor: toolContext?.actor?.id ?? null,
				metadata: { priority_hint: context?.['priority'] ?? 'normal' }
			});

			const ticketId = result?.data?.ticket_id;
			if (!ticketId) {
				return {
					status: 'error',
					code: 'UNKNOWN_RESPONSE',
					message: 'Ticket create returned no ticket_id.'
				};
			}

			return {
				status: 'created',
				ticket_id: ticketId
			};
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
