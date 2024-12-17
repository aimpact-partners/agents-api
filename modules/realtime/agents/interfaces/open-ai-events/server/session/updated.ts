import { ISession } from '../../session';

/**
 * Returned when a session is updated.
 */
export /*bundle*/ interface ISessionUpdatedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "session.created".
	type: 'session.created';

	// The session resource.
	session: ISession & {
		// The unique ID of the session.
		id: string;

		// The object type, must be "realtime.session".
		object: 'realtime.session';

		// The default model used for this session.
		model: string;
	};
}
