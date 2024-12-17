import type { ISession } from '../../session';

/**
 * Send this event to update the session’s default configuration.
 */
export /*bundle*/ interface ISessionUpdateClientEvent {
	// Optional client-generated ID used to identify this event.
	event_id: string;

	// The event type, must be "session.update".
	type: 'session.update';

	// Session configuration to update.
	session: ISession;
}
