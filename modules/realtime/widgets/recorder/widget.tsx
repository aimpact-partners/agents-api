import type { IDevice } from '@aimpact/agents-api/realtime/audio/recorder';
import React, { useEffect, useState, useRef } from 'react';
import { devices } from '@aimpact/agents-api/realtime/audio/recorder';
import { State, Observer } from '@aimpact/agents-api/realtime/widgets/state';

interface IState {
	available: IDevice[];
	selected: string;
	fetched: boolean;
	error: string;
	recorder: 
}

const Widget = () => {
	const state: State<IState> = new State();
	state.define({ available: [], selected: '', fetched: false, error: void 0 });
	const { values } = state;

	// CONTINUAR ACA!
	// Acá quiero que se observe el recorder, pero el recorder en realidad puede cambiar
	// cuando se modifica el device
	Observer.set()
	const [isRecording, setIsRecording] = useState(false);
	const [recorder, setRecorder] = useState(null);

	useEffect(() => {
		const fetchDevices = async () => {
			await devices.prepare();

			setAvailableDevices([...devices.values()]);
			setSelectedDeviceId(devices.default?.id || '');
		};
		fetchDevices();
	}, []);

	const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedDeviceId(event.target.value);
	};

	const startRecording = async () => {
		if (!selectedDeviceId) return;
		const device = devices.get(selectedDeviceId);
		if (!device) return;

		const config = { samplerate: 24000, chunks: { size: 8192 }, debug: true };
		await device.record(config);
		if (device.recorder.error) console.log('Recorder Error:', device.recorder.error);
		setRecorder(device.recorder);
		setIsRecording(true);
	};

	const pauseRecording = async () => {
		if (recorder) {
			await recorder.pause();
			setIsRecording(false);
		}
	};

	const resumeRecording = async () => {
		if (recorder) {
			await recorder.record();
			setIsRecording(true);
		}
	};

	const stopRecording = async () => {
		if (recorder) {
			await recorder.stop();
			setIsRecording(false);
			setRecorder(null);
		}
	};

	return (
		<div className="container">
			<h2>Microphone Recorder</h2>
			<div className="device-selection">
				<label htmlFor="device-select">Select Device:</label>
				<select id="device-select" value={selectedDeviceId} onChange={handleDeviceChange}>
					{availableDevices.map(device => (
						<option key={device.id} value={device.id}>
							{device.label}
						</option>
					))}
				</select>
			</div>
			<div className="controls">
				{isRecording ? (
					<>
						<button className="pause" onClick={pauseRecording}>
							Pause
						</button>
						<button className="stop" onClick={stopRecording}>
							Stop
						</button>
					</>
				) : (
					<>
						<button className="start" onClick={startRecording}>
							Start Recording
						</button>
						{recorder && (
							<button className="resume" onClick={resumeRecording}>
								Resume
							</button>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default Widget;
