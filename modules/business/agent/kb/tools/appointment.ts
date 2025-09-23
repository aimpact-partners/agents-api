import { tool } from '@openai/agents';
import { z } from 'zod';
import { Appointments } from '@aimpact/agents-api/msp/business/appointments';

export /*bundle*/ const createAppointment = tool({
	name: 'create_appointment',
	description:
		'Creates an appointment in LernLog on behalf of the requesting teacher/tutor. Requires explicit user consent and all required fields.',
	parameters: z.object({
		title: z.string().min(1).describe('Short title for the appointment.'),
		description: z.string().nullable().describe('Optional details/notes.'),
		participants: z.array(z.string().min(1)).min(1).describe('Participant IDs or slugs.'),
		startTime: z.string().describe('Start time Timestamp.'),
		endTime: z.string().describe('End time Timestamp.'),
		idempotencyKey: z.string().min(8).describe('Client-generated unique key for safe retries.')
	}),
	// toolContext is optional; align with your pattern: toolContext?.context
	async execute(
		{
			title,
			description,
			participants,
			startTime,
			endTime,
			idempotencyKey
		}: {
			title: string;
			description?: string;
			participants: string[];
			startTime: string;
			endTime: string;
			idempotencyKey: string;
		},
		toolContext?: { context?: Record<string, any>; actor?: { id?: string | null } }
	) {
		try {
			const ctx =
				toolContext?.context && Object.keys(toolContext.context).length !== 0 ? toolContext.context : undefined;

			// 1) Consent check (expected in context, e.g., { consentGranted: true })
			if (!ctx?.consentGranted) {
				return {
					status: 'error',
					code: 'CONSENT_REQUIRED',
					message: 'Explicit user consent is required before executing this action.'
				};
			}

			// 2) Basic validation (start < end)
			const start = Date.parse(startTime);
			const end = Date.parse(endTime);
			if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
				return {
					status: 'error',
					code: 'INVALID_TIME_RANGE',
					message: 'Start time must be before end time and both must be valid ISO datetimes.'
				};
			}

			// 3) Optional sanity checks
			if (!participants?.length) {
				return {
					status: 'error',
					code: 'MISSING_PARTICIPANTS',
					message: 'At least one participant is required.'
				};
			}

			// 4) Call your App API (replace with real SDK/HTTP)
			const result = await Appointments.create(
				{
					title,
					description,
					participants,
					startTime,
					endTime,
					idempotencyKey,
					actor: toolContext?.actor?.id ?? null,
					metadata: { source: 'createAppointment', ...ctx }
				},
				ctx.user
			);
			if (result.error) {
				return {
					status: 'error',
					code: 'UNKNOWN_RESPONSE',
					message: 'Appointment create returned no appointment id.'
				};
			}

			return {
				status: 'success',
				appointment_id: result.data.id,
				echo: { title, participants, startTime, endTime }
			};
		} catch (error: any) {
			const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
			return {
				status: 'error',
				code: 'APPOINTMENT_CREATE_FAILED',
				message: `Failed to create appointment: ${errorMessage}`
			};
		}
	}
});
