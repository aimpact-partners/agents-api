import React from 'react';

export const PhoneIcon = ({ isOff }: { isOff: boolean }) => (
	<svg
		viewBox="0 0 24 24"
		width="24"
		height="24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		className="mx-auto"
	>
		<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
		{isOff && <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />}
	</svg>
);

export const MicIcon = ({ isMuted }: { isMuted: boolean }) => (
	<svg
		viewBox="0 0 24 24"
		width="24"
		height="24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		className="mx-auto"
	>
		<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
		<path d="M19 10v2a7 7 0 01-14 0v-2" />
		<line x1="12" y1="19" x2="12" y2="23" />
		<line x1="8" y1="23" x2="16" y2="23" />
		{isMuted && <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" />}
	</svg>
);

export const SpeakerIcon = ({ isOff }: { isOff: boolean }) => (
	<svg
		viewBox="0 0 24 24"
		width="24"
		height="24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		className="mx-auto"
	>
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<path d={isOff ? '' : 'M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07'} />
		{isOff && (
			<>
				<line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
				<line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
			</>
		)}
	</svg>
);
