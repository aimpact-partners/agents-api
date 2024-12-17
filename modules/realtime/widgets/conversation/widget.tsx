import React, { useState, useRef } from 'react';
import { Agent } from '@aimpact/agents-api/realtime/agent';
import { devices } from '@aimpact/agents-api/realtime/audio/recorder';
import { StreamPlayer } from '@aimpact/agents-api/realtime/audio/player';

const key = localStorage.getItem('openai-key');

const Widget = () => {
	const [availableDevices, setAvailableDevices] = useState([]);

	const refs = {
		agent: useRef<Agent>(new Agent({ dangerouslyAllowAPIKeyInBrowser: true, apiKey: key }))
	};

	return <>Hello</>;
};

export default Widget;
