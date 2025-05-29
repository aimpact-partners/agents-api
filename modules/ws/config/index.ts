export /*bundle*/ let url: string;

export /*bundle*/ const setUrl = function (_url: string): void {
	if (!_url) throw new Error(`Attribute 'url' must be specified`);
	url = _url;
};
