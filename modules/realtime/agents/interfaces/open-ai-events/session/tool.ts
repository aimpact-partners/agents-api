export /*bundle*/ type IToolParameterType = {
	type: 'object';
	properties: Record<string, { type: 'string' }>;
	required?: string[];
};

/**
 * Tools (functions) available to the model.
 */
export /*bundle*/ interface ITool {
	// The type of the tool.
	type: 'function';

	// The name of the function.
	name: string;

	// The description of the function.
	description: string;

	// Parameters of the function in JSON Schema.
	parameters: { [key: string]: any };
}

/**
 * How the model chooses tools.
 */
export /*bundle*/ type ToolChoiceType = 'auto' | 'none' | 'required' | { type: 'function'; name: string };
