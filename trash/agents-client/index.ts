import { overwrite } from '@aimpact/agents-client/endpoint';
import * as dotenv from 'dotenv';
dotenv.config();

const { ENVIRONMENT } = process.env;

let port;
let environment;
if (ENVIRONMENT === 'local') port = 5040;
else environment = <'development' | 'testing' | 'beta' | 'production'>ENVIRONMENT;

overwrite({ port, environment });
