export const getExtension = (mimeType: string): string | null => {
	switch (mimeType) {
		case 'text/plain':
			return '.txt';
		case 'application/pdf':
			return '.pdf';
		case 'application/msword':
			return '.doc';
		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
			return '.docx';
		case 'application/vnd.ms-excel':
			return '.xls';
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			return '.xlsx';
		case 'application/vnd.ms-powerpoint':
			return '.ppt';
		case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
			return '.pptx';
		case 'application/rtf':
			return '.rtf';
		default:
			return null;
	}
};
