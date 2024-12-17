import { CharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

export /*bundle*/ class DocumentsV2 {
	/**
	 *
	 * @param path temporary directory where files uploaded by the user are stored on disk
	 * @param metadata contains the metadata to write to the vector
	 */
	async get(path: string, metadata = {}) {
		if (!path) return { error: 'not path to embed' };

		// Validar que el path exista

		const splitter = new CharacterTextSplitter();

		try {
			path = path.replace(/\\/g, '/');
			const loader = new DirectoryLoader(path, {
				'.docx': path => new DocxLoader(path),
				'.pdf': path => new PDFLoader(path),
				'.txt': path => new TextLoader(path)
			});

			const items = await loader.loadAndSplit(splitter);
			items.forEach(item => (item.metadata = Object.assign(item.metadata, metadata)));

			//Delete tempDir by path

			return { data: items };
		} catch (exc) {
			return { error: exc.message };
		}
	}
}
