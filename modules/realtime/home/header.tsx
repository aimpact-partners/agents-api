import * as React from 'react';

interface HeaderProps {
	apiKey: string;
	resetAPIKey: () => void;
}

export function Header({ apiKey, resetAPIKey }: HeaderProps): JSX.Element {
	return (
		<div className="content-top">
			<div className="content-title">
				<img src="/openai-logomark.svg" alt="OpenAI Logo" />
				<span>Realtime Console</span>
			</div>
			<div className="content-api-key">
				<button onClick={resetAPIKey}>API Key: {apiKey.slice(0, 3)}...</button>
			</div>
		</div>
	);
}
