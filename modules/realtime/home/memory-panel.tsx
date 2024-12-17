import * as React from 'react';

interface MemoryPanelProps {
	memoryKv: { [key: string]: any };
}

export function MemoryPanel({ memoryKv }: MemoryPanelProps): JSX.Element {
	return (
		<div className="content-block kv">
			<div className="content-block-title">set_memory()</div>
			<div className="content-block-body content-kv">{JSON.stringify(memoryKv, null, 2)}</div>
		</div>
	);
}
