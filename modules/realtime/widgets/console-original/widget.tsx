import React, { useEffect, useState, useRef } from 'react';
import { ClientSession } from '@aimpact/agents-api/realtime/client';
import { Conversation } from '@aimpact/agents-api/realtime/client/conversation';
import { State } from '@aimpact/agents-api/realtime/widgets/state';
import { PhoneIcon, MicIcon, SpeakerIcon } from './icons';
import { SelectDevice } from './devices';

export default function Widget() {
	const refs = {
		conversation: useRef<Conversation>(new Conversation('123')),
		client: useRef<ClientSession>(new ClientSession({ vad: null }))
	};

	const state: State<{ muted: boolean; speaker: boolean; duration: number }> = new State();
	state.define({ muted: true, speaker: false, duration: 0 });
	const { values } = state;

	const invalidate = (() => {
		const [id, invalidate] = useState(0);
		return () => invalidate(id + 1);
	})();

	// Set current conversation
	const conversation = refs.conversation.current;
	const client = refs.client.current;

	client.conversation.set(conversation);

	useEffect(() => {
		console.log('window.client:', client);
		(window as any).client = client;

		client.on('session.open', invalidate);
		client.on('session.created', invalidate);
		client.on('session.ready', invalidate);
		client.on('session.close', invalidate);

		return () => {
			client.off('session.open', invalidate);
			client.off('session.created', invalidate);
			client.off('session.ready', invalidate);
			client.off('session.close', invalidate);
		};
	}, []);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval>;

		const ready = () => {
			console.warn('ready');
			interval = setInterval(() => values.duration++, 1000);
		};
		const initiate = () => {
			console.log('client.update... send: conversation and firebaseToken');
			const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjgxYjUyMjFlN2E1ZGUwZTVhZjQ5N2UzNzVhNzRiMDZkODJiYTc4OGIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRsOpbGl4IFRvdmFyIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FBY0hUdGV3WkFlSC0yOXAzUUotcndFdVV1TVRBampTNEZna09zZkMwdjFtPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2FpbXBhY3QtcGFydG5lcnMtZGV2IiwiYXVkIjoiYWltcGFjdC1wYXJ0bmVycy1kZXYiLCJhdXRoX3RpbWUiOjE3MzY1NDgzNDUsInVzZXJfaWQiOiI4Y0dmMmpPbERMWlJDWTZyUVdXc0xuaGpNQjYyIiwic3ViIjoiOGNHZjJqT2xETFpSQ1k2clFXV3NMbmhqTUI2MiIsImlhdCI6MTczODA5OTE1OSwiZXhwIjoxNzM4MTAyNzU5LCJlbWFpbCI6ImZlbGl4QGJleW9uZGpzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTEwNDcxNTE1MzE1OTYzOTg4NjA5Il0sImVtYWlsIjpbImZlbGl4QGJleW9uZGpzLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.CHkrLTBQSvaPtgcqKdrksI2hi4nah3gJe_Kz7MIoVSICEXO1BLJXMDzENTbCY9N_d2Cmiw5Pz1SnejQXSsxIbBGnsEDclGS2Jpm55-IkMVfjqxOucYjfDfs1xiSHbtOkLf2D9lGTPfPHaEc07c4nQwRabcRsiNkLjFqoitGCPvR0Ej6FtzV2EbAgQITdsyXYplK8RC6ZCGPQWofzXCMoBc-i_xDBWLG9qTrpnnAvc9_SDCwPEQMqTJgmvDZT6NxItAZOq3fIb83-MZ2m4o-9HKwmk-oYDhVUlyA1l4p-lOaBGGXF2ePqunldXhoVWwg24o5PH_a_fZ0E63S09G7whA`;
			// Add error handling
			client.update({ conversation: { id: 'bae72688-f37d-462e-b37d-fab80189c668' }, token });
			interval = setInterval(() => values.duration++, 1000);
		};
		const end = () => {
			clearInterval(interval);
			values.duration = 0;
		};

		client.on('session.created', initiate);
		client.on('session.ready', ready);
		client.on('session.close', end);

		return () => {
			end();
			client.off('session.created', initiate);
			client.off('session.ready', ready);
			client.off('session.close', end);
		};
	}, []);

	const mins = Math.floor(values.duration / 60);
	const secs = values.duration % 60;
	const timer = `${mins}:${secs.toString().padStart(2, '0')}`;

	const handlers = {
		call: () => {
			if (client.status === 'closed') {
				client.connect();
				invalidate(); // To update calling state to 'connecting'
			}
			if (['open', 'created'].includes(client.status)) {
				client.close();
				invalidate(); // To update calling state to 'closing'
			}
		},
		onmic: () => {
			const muted = !values.muted;
			values.muted = muted;

			muted ? client.recorder.stop() : client.recorder.record();
		}
	};

	const { status, valid } = client;
	const active = ['connecting', 'open', 'created'].includes(status);

	if (!valid) {
		const { recorder, player } = client;
		const errors = [];
		if (recorder?.error) {
			errors.push(<div key="recorder-error">• Recorder is invalid: {recorder.error.message}</div>);
		}
		if (player?.error) {
			errors.push(<div key="player-error">• Audio player is invalid: {player.error.message}</div>);
		}

		return (
			<div className="phone flex items-center justify-center min-h-screen bg-gray-100">
				<div>Errors found:</div>
				{errors}
			</div>
		);
	}

	return (
		<div className="phone flex items-center justify-center min-h-screen bg-gray-100">
			<div className="w-80 bg-white rounded-lg shadow-xl p-6">
				{/* Call Info */}
				<div className="text-center mb-8">
					<p className="text-gray-500">
						{status === 'closed' && 'Ready to call'}
						{status === 'connecting' && 'Calling.'}
						{status === 'open' && 'Calling...'}
						{status === 'closing' && 'Hunging up'}
						{status === 'created' && timer}
					</p>
				</div>

				{/* Controls */}
				<div className="grid grid-cols-3 gap-4 mb-6">
					<button
						type="button"
						aria-label="Set mic on/off"
						onClick={handlers.onmic}
						disabled={!active}
						className={`p-4 rounded-full flex items-center justify-center transition-colors ${
							!active
								? 'bg-gray-100 text-gray-400 cursor-not-allowed'
								: values.muted
								? 'bg-red-100 text-red-600'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
						}`}
					>
						<MicIcon isMuted={values.muted} />
					</button>
					<button
						type="button"
						aria-label="Call button"
						onClick={handlers.call}
						className={`p-4 rounded-full flex items-center justify-center transition-colors ${
							active
								? 'bg-red-500 text-white hover:bg-red-600'
								: 'bg-green-500 text-white hover:bg-green-600'
						}`}
					>
						<PhoneIcon isOff={active} />
					</button>
					<button
						type="button"
						aria-label="Set speaker on/off"
						onClick={() => (values.speaker = !values.speaker)}
						disabled={!active}
						className={`p-4 rounded-full flex items-center justify-center transition-colors ${
							!active
								? 'bg-gray-100 text-gray-400 cursor-not-allowed'
								: values.speaker
								? 'bg-blue-100 text-blue-600'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
						}`}
					>
						<SpeakerIcon isOff={!values.speaker} />
					</button>
				</div>

				<SelectDevice client={client}></SelectDevice>
			</div>
		</div>
	);
}
