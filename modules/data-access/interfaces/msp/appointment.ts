export /*bundle*/ interface IAppointmentBase {
	id: string;
	title: string;
	description?: string;
	participants: string[];
	start_time: string;
	end_time: string;
	idempotency_key: string;
}

export /*bundle*/ interface IAppointmentData extends IAppointmentBase {}
