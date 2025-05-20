import config from '@aimpact/agents-api/config';

const project = <'rvd' | 'better-mind'>config.params.project;
type Environments = 'local' | 'development' | 'testing' | 'quality' | 'production';
interface IEndpoint {
	port?: number;
	environment: Environments;
}

const environments: { [key in Environments]: { rvd: string; 'better-mind': string } } = {
	local: {
		rvd: 'wss://dev.agents.api.aimpact.partners',
		'better-mind': 'wss://agents-api-883367315651.europe-west10.run.app'
	},
	development: {
		rvd: 'wss://dev.agents.api.aimpact.partners',
		'better-mind': 'wss://agents-api-883367315651.europe-west10.run.app'
	},
	testing: {
		rvd: 'wss://test.agents.api.aimpact.partners',
		'better-mind': 'wss://agents-api-883367315651.europe-west10.run.app'
	},
	quality: {
		rvd: 'wss://beta.agents.api.aimpact.partners',
		'better-mind': 'wss://agents-api-883367315651.europe-west10.run.app'
	},
	production: {
		rvd: 'wss://agents.api.aimpact.partners',
		'better-mind': 'wss://agents-api-883367315651.europe-west10.run.app'
	}
};

export /*bundle*/ let url = environments.production[project];

export /*bundle*/ const setEnv = function ({ port, environment }: IEndpoint): void {
	environment = !environment && !port ? 'production' : environment;
	url = port ? `http://localhost:${port}` : environments[environment][project];
};
