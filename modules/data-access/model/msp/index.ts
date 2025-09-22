import type { IAppointmentData, ITicketData } from '@aimpact/agents-api/data/interfaces';
import { Collection } from '@beyond-js/firestore-collection/collection';

export /*bundle*/ const appointments: Collection<IAppointmentData> = new Collection('Appointments');
export /*bundle*/ const tickets: Collection<ITicketData> = new Collection('Tickets');
