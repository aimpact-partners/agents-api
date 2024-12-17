import * as functions from '@google-cloud/functions-framework';
import { uploader } from '@aimpact/chat-api/routes';
import * as dotenv from 'dotenv';
dotenv.config();

const setHeaders = res => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST');
	res.set('Access-Control-Allow-Headers', 'Content-Type');
	res.set('Access-Control-Max-Age', '3600');
};
const run = (req, res) => {
	setHeaders(res);
	uploader(req, res);
};
process.env.FUNCTION_REGION && functions.http('chat-api-uploader', run);
