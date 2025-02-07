import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';

export /*bundle*/ class Documents {
	#splitter = new CharacterTextSplitter();

	#path: string;
	get path() {
		return this.#path;
	}
	#items;
	get items() {
		return this.#items;
	}

	/**
	 *
	 * @param path temporary directory where files uploaded by the user are stored on disk
	 * @param metadata contains the metadata to write to the vector
	 * @returns
	 */
	async prepare(path: string, metadata = {}) {
		if (!path) return { status: false, error: 'undefined path to embed' };

		// Validar que el path exista
		try {
			this.#path = path.replace(/\\/g, '/');
			const loader = new DirectoryLoader(this.#path, {
				'.docx': path => new DocxLoader(path),
				'.pdf': path => new PDFLoader(path),
				'.txt': path => new TextLoader(path),
			});
			this.#items = await loader.loadAndSplit(this.#splitter);
			this.#items.forEach(item => (item.metadata = Object.assign(item.metadata, metadata)));
			return { status: true };
		} catch (exc) {
			return { status: false, error: exc.message };
		}
	}
}
