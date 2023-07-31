import { Request, Response } from 'express';
import AppError from '../../errors/appError';
import { prisma } from '../../utils';

type Data = {
	success: boolean;
	error: boolean;
	message: string;
	post: {
		id: string | null;
		title: string | null;
		description: string | null;
	} | null;
};

type R = Request & {
	user?: {
		id: string;
	};
};

export default async function handler(req: R, res: Response<Data>) {
	try {
		validateBody(req);

		const post = await prisma.posts.create({
			data: {
				title: req.body.title,
				description: req.body?.description || null,
				user_id: req.user?.id as string,
			},

			select: {
				id: true,
				title: true,
				description: true,
			},
		});

		res.status(200).json({
			success: true,
			error: false,
			message: 'post created',
			post: {
				...post,
			},
		});
	} catch (err: unknown) {
		if (err instanceof AppError) {
			res.status(err.statusCode).json({
				success: false,
				error: true,
				message: err.message,
				post: null,
			});

			return;
		}

		res.status(500).json({
			success: false,
			error: true,
			message: 'internal server error',
			post: null,
		});
	} finally {
		await prisma.$disconnect();
	}
}

function validateBody(req: Request) {
	if (!req.body?.title) {
		throw new AppError('missing field title', 400);
	}

	if (req.body?.title?.length > 200) {
		throw new AppError('title too long', 422);
	}
}
