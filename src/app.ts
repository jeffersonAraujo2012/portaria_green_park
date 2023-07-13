import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import boletosRouter from './modules/boletos/boletos.router';
dotenv.config();

const app = express();

app.use(cors());
app.use('/boletos', boletosRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor online na porta: ${PORT}`);
});
