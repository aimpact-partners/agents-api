export /*bundle*/ interface ITicketBase {
	id: string;
	title: string;
	summary: string;
	component: 'Scheduling' | 'Account/Auth' | 'Avatar' | 'Consultations' | 'Other';
	context: Record<string, unknown>;
	attachments?: string[];
	timestamp: string;
}

export /*bundle*/ interface ITicketData extends ITicketBase {}
