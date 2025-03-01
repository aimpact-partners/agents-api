type Environments = 'development' | 'testing' | 'beta' | 'production';
interface IEndpoint {
	port?: number;
	environment: Environments;
}

const environments: { [key in Environments]: string } = {
	development: 'wss://dev.agents.api.aimpact.partners',
	testing: 'wss://test.agents.api.aimpact.partners',
	beta: 'wss://beta.agents.api.aimpact.partners',
	production: 'wss://agents.api.aimpact.partners'
};

export /*bundle*/ let url = environments.production;

export /*bundle*/ const setEnv = function ({ port, environment }: IEndpoint): void {
	environment = !environment && !port ? 'production' : environment;
	url = port ? `http://localhost:${port}` : environments[environment];
};
