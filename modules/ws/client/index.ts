import { setEnv } from '@aimpact/agents-api/ws-config';
import * as dotenv from 'dotenv';

dotenv.config();

const { ENVIRONMENT } = process.env;

let port;
let environment;
if (ENVIRONMENT === 'local') port = 5040;
else environment = <'development' | 'testing' | 'quality' | 'production'>ENVIRONMENT;

setEnv({ port, environment });
