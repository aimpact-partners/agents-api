export const getExtension = (mimeType: string): string | null => {
	switch (mimeType) {
		case 'audio/mpeg':
			return '.mp3';
		case 'audio/aac':
			return '.aac';
		case 'audio/wav':
			return '.wav';
		case 'audio/ogg':
			return '.ogg';
		case 'audio/webm':
			return '.webm';
		case 'audio/mp4':
			return '.m4a';
		case 'video/webm':
			return '.webm';
		default:
			return null;
	}
};
