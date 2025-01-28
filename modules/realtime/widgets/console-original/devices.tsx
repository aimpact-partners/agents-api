import type { ClientSessionBase } from '@aimpact/agents-api/realtime/client/base';
import { devices, IDevice } from '@aimpact/agents-api/realtime/audio/recorder';
import React, { useEffect, useState } from 'react';
import { State } from '@aimpact/agents-api/realtime/widgets/state';

interface IState {
	available: IDevice[];
	selected: string;
	fetched: boolean;
	error: string;
}

export const SelectDevice = ({ client }: { client: ClientSessionBase }) => {
	const state: State<IState> = new State();
	state.define({ available: [], selected: '', fetched: false, error: void 0 });
	const { values } = state;

	useEffect(() => {
		devices
			.prepare()
			.then(() => {
				values.available = [...devices.values()];
				values.fetched = true;
				select(devices.default?.id || '');
			})
			.catch(exc => {
				console.error(exc);
				values.error = `Error caught looking for devices`;
			});
	}, []);

	const select = (id: string) => {
		values.selected = id;
		const device = values.available.find(device => device.id === id);
		client.recorder.device = device;
	};

	const onchange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		select(event.target.value);
	};

	if (!values.fetched) return null;

	return (
		<div className="device-selection">
			<label htmlFor="device-select">Select Device:</label>
			<select id="device-select" value={values.selected} onChange={onchange}>
				{values.available.map(device => (
					<option key={device.id} value={device.id}>
						{device.label}
					</option>
				))}
			</select>
		</div>
	);
};
