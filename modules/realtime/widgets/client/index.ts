import { setEnv } from '@aimpact/agents-api/ws-config';
import config from '@aimpact/agents-api/config';

let port;
let environment;
if (config.environment === 'local') port = 5040;
else environment = <'development' | 'testing' | 'beta' | 'production'>config.environment;

setEnv({ port, environment });
