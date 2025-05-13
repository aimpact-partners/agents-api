type Environments = 'local' | 'development' | 'testing' | 'quality' | 'production';
interface IEndpoint {
	port?: number;
	environment: Environments;
}

const environments: { [key in Environments]: string } = {
	local: 'wss://dev.agents.api.aimpact.partners',
	development: 'wss://dev.agents.api.aimpact.partners',
	testing: 'wss://test.agents.api.aimpact.partners',
	quality: 'wss://beta.agents.api.aimpact.partners',
	production: 'wss://agents.api.aimpact.partners'
};

export /*bundle*/ let url = environments.production;

export /*bundle*/ const setEnv = function ({ port, environment }: IEndpoint): void {
	environment = !environment && !port ? 'production' : environment;
	url = port ? `http://localhost:${port}` : environments[environment];
};
