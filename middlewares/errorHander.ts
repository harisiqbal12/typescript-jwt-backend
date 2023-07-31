import {
	ErrorRequestHandler,
	Request,
	Response,
	NextFunction,
	response,
} from 'express';

export const errorHandler = (
	err: ErrorRequestHandler,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	res.status(500).send('Something went wrong');
	// next(err);
};

export const invalidPathHandler = (
	request: Request,
	response: Response,
	next: NextFunction
) => {
	response.status(404);
	response.send('invalid path | path not found');
	// next();
};
