import type { IResponseItem } from '@aimpact/agents-api/realtime/interfaces/item';

/**
 * The response resource.
 */
export /*bundle*/ interface IRealtimeResponse {
	// The unique ID of the response.
	id: string;

	// The object type, must be "realtime.response".
	object: 'realtime.response';

	// The status of the response ("in_progress").
	status: string;

	// Additional details about the status.
	status_details: object;

	// The list of output items generated by the response.
	output: IResponseItem[];

	// Usage statistics for the response.
	usage?: {
		total_tokens: number;
		input_tokens: number;
		output_tokens: number;
	};
}
