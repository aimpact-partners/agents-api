import React, { useEffect, useRef, useCallback, useState } from 'react';

export default function ConversationItems() {
	const refs = {
		agent: useRef<Agent>(new Agent({ conversation })),
		scroll: {
			start: useRef<string>(new Date().toISOString()), // Timing delta for event log displays
			height: useRef(0), // Autoscrolling event logs
			events: useRef<HTMLDivElement>(null)
		}
	};

	/**
	 * Auto-scroll the event logs
	 */
	useEffect(() => {
		const events = refs.scroll.events?.current;
		if (!events) return;

		const { scrollHeight } = events;

		// Only scroll if height has just changed
		if (events.scrollHeight !== refs.scroll.height.current) {
			events.scrollTop = scrollHeight;
			refs.scroll.height.current = scrollHeight;
		}
	}, [realtimeEvents]);

	/**
	 * Auto-scroll the conversation logs
	 */
	useEffect(() => {
		const elements = [].slice.call(document.body.querySelectorAll('[data-conversation-content]'));
		for (const element of elements) {
			element.scrollTop = element.scrollHeight;
		}
	}, [items]);
}
