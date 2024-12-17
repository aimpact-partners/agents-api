/**
 * Emitted after every "response.done" event to indicate the updated rate limits.
 */
export /*bundle*/ interface IResponseRateLimitsUpdatedServerEvent {
	// The unique ID of the server event.
	event_id: string;

	// The event type, must be "rate_limits.updated".
	type: 'rate_limits.updated';

	// List of rate limit information.
	rate_limits: {
		// The name of the rate limit ("requests", "tokens", "input_tokens", "output_tokens").
		name: 'requests' | 'tokens' | 'input_tokens' | 'output_tokens';

		// The maximum allowed value for the rate limit.
		limit: 1000;

		// The remaining value before the limit is reached.
		remaining: 999;

		// Seconds until the rate limit resets.
		reset_seconds: 60;
	}[];
}
