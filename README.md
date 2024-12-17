# How to run the `@aimpact/agents-api` package

## Copy Environment File

Locate the `.env-example` file in the root of the project. Create a copy of this file and rename it to `.env`.

## Add Credentials

Open the `.env` file in a text editor. Fill in all the necessary credential values that the application requires.

## Google Cloud Service Account

Make sure you have a service account set up in your Google Cloud project with the appropriate permissions to access the
required APIs. Obtain the service account credentials JSON file.

## Configure Google Cloud Service Account

Place the service account credentials JSON file you obtained in the previous step into the root of the project. Rename
the file to `credentials/gcloud.json`.
