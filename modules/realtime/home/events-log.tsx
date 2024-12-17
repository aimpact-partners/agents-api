import * as React from 'react';

interface EventsLogProps {
	events: any[];
	expandedEvents: { [key: string]: boolean };
	setExpandedEvents: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

export function EventsLog({ events, expandedEvents, setExpandedEvents }: EventsLogProps): JSX.Element {
	return (
		<div className="content-block events">
			<div className="content-block-title">events</div>
			<div className="content-block-body">
				{!events.length && `awaiting connection...`}
				{events.map(event => {
					const isExpanded = !!expandedEvents[event.event_id];
					return (
						<div className="event" key={event.event_id}>
							<div
								className="event-summary"
								onClick={() => {
									setExpandedEvents(expanded => ({
										...expanded,
										[event.event_id]: !isExpanded
									}));
								}}
							>
								<span>
									{event.source} - {event.type}
								</span>
							</div>
							{isExpanded && <div className="event-details">{JSON.stringify(event, null, 2)}</div>}
						</div>
					);
				})}
			</div>
		</div>
	);
}
