import * as path from 'path';
import * as multer from 'multer';
import { v4 as uuid } from 'uuid';

export /*bundle*/ const multerUpload = multer({
	storage: multer.diskStorage({
		destination: 'uploads',
		filename: (req, file, cb) => {
			const fileName = uuid() + path.extname(file.originalname);
			cb(null, fileName);
		}
	})
});
