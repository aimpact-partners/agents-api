# Continuous Deployment Guide for Cloud Run

This guide outlines the necessary steps to compile and deploy your backend using continuous integration on Google Cloud
Run. Follow these updated steps to ensure a smooth and seamless development process.

## Repositories and Branches

Define the Repository and Compilation Branch following best practices. Use the convention `environment/deploy`, where
environments can be: [development - testing - production]

Examples of branch names:

    development/deploy - testing/deploy - production/deploy

## Google Cloud Run Configuration

1. Access the URL of your Google Cloud project.

2. Create a new service on Google Cloud Run.

3. Choose "Continuous Deployment" from a repository.

4. Grant secure repository access permissions:

    - Select the Dockerfile as the configuration file.

    - Provide the complete path to the Dockerfile in the repository.

    - Ensure the Dockerfile is located at the specified path within the remote repository.

5. Configure the region where you want to deploy the service.

6. Set resource allocation and pricing:

    - CPU allocation applies during request processing.

    - Enable auto-scaling with a range of instances: minimum (0) and maximum (2).

7. Control service access:

    - Allow all incoming requests.

8. Configure authentication:

    - Enable unauthenticated invocations.

9. Select the "Increase CPU at startup" option.

10. Define resource capacity for different environments:

    - Development: 256 MB of RAM - 1 CPU.

    - Testing: 512 MB of RAM - 1 CPU.

    - Production: 512 MB of RAM - 1 CPU.

11. Add necessary environment variables using the example provided in `.env-example`.

### IMPORTANT NOTE

After creating the service, you might encounter an activation error during compilation. Resolve this issue by following
these steps:

1. Access the Cloud Build triggers.

2. Select the trigger corresponding to the service in question.

3. Edit the `.yaml` file and ensure the Dockerfile path is accurate. The path follows the standard:

`/.deploy/[environment]/[distribution]/Dockerfile`

## Ready for Continuous Deployment

By following these updated steps, you can continuously build and deploy your backend to Google Cloud Run. use this
guidance whenever necessary to ensure accurate and successful build and deployment processes.
