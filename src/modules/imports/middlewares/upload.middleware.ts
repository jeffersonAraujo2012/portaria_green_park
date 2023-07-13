import multer from 'multer';
import path from 'path';

const tempFolder = path.resolve(__dirname, '..', '..', '..', '..', 'tmp');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: tempFolder,
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

export default upload;
