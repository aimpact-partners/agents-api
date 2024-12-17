// import React, { useState, useEffect } from 'react';

// export default () => {
// 	const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
// 	const [isMuted, setIsMuted] = useState(false);
// 	const [isSpeakerOn, setSpeakerOn] = useState(false);
// 	const [callDuration, setCallDuration] = useState(0);
// 	const [callerName] = useState('John Doe');

// 	useEffect(() => {
// 		let timer: ReturnType<typeof setInterval>;

// 		if (callStatus === 'connected') {
// 			timer = setInterval(() => {
// 				setCallDuration(prev => prev + 1);
// 			}, 1000);
// 		}
// 		return () => clearInterval(timer);
// 	}, [callStatus]);

// 	useEffect(() => {
// 		if (callStatus === 'ended' || callStatus === 'idle') {
// 			setIsMuted(false);
// 			setSpeakerOn(false);
// 		}
// 	}, [callStatus]);

// 	const formatTime = (seconds: number) => {
// 		const mins = Math.floor(seconds / 60);
// 		const secs = seconds % 60;
// 		return `${mins}:${secs.toString().padStart(2, '0')}`;
// 	};

// 	const handleCallButton = () => {
// 		if (callStatus === 'idle') {
// 			setCallStatus('calling');
// 			setTimeout(() => setCallStatus('connected'), 2000);
// 		} else {
// 			setCallStatus('ended');
// 			setCallDuration(0);
// 			setTimeout(() => setCallStatus('idle'), 1500);
// 		}
// 	};

// 	const isCallActive = callStatus === 'connected' || callStatus === 'calling';
// };
