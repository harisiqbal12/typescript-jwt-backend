import express from 'express';
import router from './routers';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, invalidPathHandler } from './middlewares';

import 'dotenv/config';

const app = express();

app.use(
	cors({
		origin: '*', // use frontend endpoint here
		credentials: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', router);

app.use(errorHandler);
app.use(invalidPathHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Server running at ${PORT}`);
});

export default app;
