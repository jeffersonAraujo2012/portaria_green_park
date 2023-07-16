import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import boletosRouter from './modules/tickets/tickets.router';
dotenv.config();

const app = express();

app.use(cors());
app.use('/boletos', boletosRouter);

export default app;
