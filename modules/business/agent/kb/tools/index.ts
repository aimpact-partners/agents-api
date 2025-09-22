import { createAppointmentTool } from './appointment';
import { searcher } from './kb';
// // import { createSupportTicketTool } from './ticket';

export const tools = [searcher, createAppointmentTool];
