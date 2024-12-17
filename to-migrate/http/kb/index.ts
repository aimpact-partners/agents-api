import type { Request, Response, Application } from 'express';
import { db } from '@beyond-js/firestore-collection/db';
import { uploader } from '@aimpact/chat-api/documents-upload';
import { KB, Documents } from '@aimpact/chat-api/models/kb';
import { KB as KBPinecone, Documents as DocumentsV2 } from '@aimpact/chat-api/business/kb';
import * as dotenv from 'dotenv';
dotenv.config();

interface IMetadata {
	id: string;
	as?: string;
}

export class KBRoutes {
	static setup(app: Application) {
		app.use((err, req, res, next) => {
			res.status(err.status || 500).json({
				message: err.message,
				errors: err.errors
			});
		});

		app.get('/kb/query', KBRoutes.query);
		app.post('/kb/texts', KBRoutes.texts);

		app.post('/kb/upload', uploader);

		app.get('/kb/search', KBRoutes.search);
		app.post('/kb/documents', KBRoutes.documents);
	}

	/**
	 * Actualizamos el vector a partir de un texto
	 * se llama mediante una task
	 * @param req
	 * @param res
	 * @returns
	 */
	static async texts(req: Request, res: Response) {
		const { content, metadata, token } = req.body;
		if (token !== process.env.GCLOUD_INVOKER) {
			return res.status(400).send({ status: false, error: 'Token request not valid' });
		}

		await KBPinecone.upsert('ailearn', metadata, metadata.id, content);

		res.json({ status: true });
	}

	/**
	 * Busqueda dentro del vector
	 * se llama mediante una task
	 * @param req
	 * @param res
	 * @returns
	 */
	static async query(req: Request, res: Response) {
		const { text, token } = req.query;
		if (token !== process.env.GCLOUD_INVOKER) {
			return res.status(400).send({ status: false, error: 'Token request not valid' });
		}

		const filter = <string>req.query.filter;
		let metadata: IMetadata;
		try {
			metadata = JSON.parse(filter);
		} catch (e) {
			return res.status(400).send({ status: false, error: 'Parameter filter not valid' });
		}

		const { status, error, matches } = await KBPinecone.query('ailearn', metadata, text);
		res.json({ status, error, data: { matches } });
	}

	// static async documentsv2(req: Request, res: Response) {
	// 	const { id } = req.params;
	// 	const { path, metadata, token } = req.body;
	// 	if (token !== process.env.GCLOUD_INVOKER) {
	// 		return res.status(400).send({ status: false, error: 'Token request not valid' });
	// 	}

	// 	if (!id) return { status: false, error: `knowledgeBox id is required` };
	// 	if (!path) return { status: false, error: `path is required` };

	// 	// const { data, error } = new DocumentsV2.get(path, metadata);

	// 	// const statusKB = !error ? 'failed' : 'processed';
	// 	// const collection = db.collection('KnowledgeBoxes');
	// 	// await collection.doc(id).update({ status: statusKB });

	// 	if (!error) {
	// 		return error;
	// 	}

	// 	if (!documents.items.length) {
	// 		return { status: false, error: `Documents not found in path "${path}"` };
	// 	}

	// 	// const { status, error, data } = await KB.update(documents);
	// 	// res.json({ status, error, data });
	// }

	/**
	 * Actualizamos el vector luego de cargado un documento
	 * se llama mediante una task
	 * @param req
	 * @param res
	 * @returns
	 */
	static async documents(req: Request, res: Response) {
		const { id } = req.params;
		const { path, metadata, token } = req.body;
		if (token !== process.env.GCLOUD_INVOKER) {
			return res.status(400).send({ status: false, error: 'Token request not valid' });
		}

		if (!id) return { status: false, error: `knowledgeBox id is required` };
		if (!path) return { status: false, error: `path is required` };

		const documents = new Documents();
		const response = await documents.prepare(path, metadata);

		const statusKB = !response.status ? 'failed' : 'processed';
		const collection = db.collection('KnowledgeBoxes');
		await collection.doc(id).update({ status: statusKB });

		if (!response.status) {
			return response;
		}

		if (!documents.items.length) {
			return { status: false, error: `Documents not found in path "${path}"` };
		}

		const { status, error, data } = await KB.update(documents);
		res.json({ status, error, data });
	}

	/**
	 * hace una busqueda dentro del vector segun el texto y los filtros pasados como parametros
	 * @param req
	 * @param res
	 * @returns
	 */
	static async search(req: Request, res: Response) {
		const { text, token } = req.query;
		const filter = <string>req.query.filter;

		let metadata: IMetadata;
		try {
			metadata = JSON.parse(filter);
		} catch (e) {
			return res.status(400).send({ status: false, error: 'Parameter filter not valid' });
		}

		if (token !== process.env.GCLOUD_INVOKER) {
			return res.status(400).send({ status: false, error: 'Token request not valid' });
		}

		const { status, error, data } = await KB.similaritySearch(text, metadata, 3);
		const results = data.map(document => document.pageContent);

		res.json({ status, error, data: { results } });
	}
}
