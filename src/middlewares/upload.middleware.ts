import multer from 'multer';
import path from 'path';
import fs from 'fs';

const tempFolder = path.resolve(__dirname, '..', '..', 'tmp');

const storage = multer.diskStorage({
  destination: tempFolder,
  filename: function (req, file, cb) {
    fs.mkdirSync(tempFolder, {recursive: true});
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

export default upload;
