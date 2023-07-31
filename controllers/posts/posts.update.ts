import { Request, Response } from 'express';
import { prisma } from '../../utils';
import AppError from '../../errors/appError';
import { Prisma } from '@prisma/client';

type Data = {
	success: boolean;
	error: boolean;
	post: {
		id: string;
		description: string | null;
		title: string;
		user: {
			name: string;
			email: string;
		};
	} | null;
	message: string | null;
};

type R = Request & {
	user?: {
		id: string;
	};
};

export default async function handler(req: R, res: Response<Data>) {
	try {
		validateBody(req);

		let data: { [key: string]: string } = {};

		Object.keys(req.body).forEach(el => {
			if (el !== 'post_id') {
				data[el] = req.body[el];
			}
		});

		const post = await prisma.posts.findFirstOrThrow({
			where: {
				AND: [
					{
						id: req.body?.post_id,
					},
					{
						user_id: req.user?.id,
					},
				],
			},

			select: {
				id: true,
			},
		});

		const updatedPost = await prisma.posts.update({
			where: {
				id: post.id,
			},

			data: {
				...(data as { title: string; description?: string }),
			},

			select: {
				id: true,
				description: true,
				title: true,
				user: {
					select: {
						name: true,
						email: true,
					},
				},
			},
		});

		res.status(200).json({
			success: true,
			error: false,
			message: 'updated posts',
			post: updatedPost,
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

		if (err instanceof Prisma.PrismaClientKnownRequestError) {
			if (err.code === 'P2025') {
				res.status(404).json({
					success: false,
					error: true,
					message: 'no post found or this post does not belongs to you',
					post: null,
				});
				return;
			}
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
	if (!req.body.post_id) {
		throw new AppError('post id required', 400);
	}

	if (!req.body?.title && !req.body?.description) {
		throw new AppError('please define title or description to update post', 400);
	}

	if (req.body?.title?.length > 200) {
		throw new AppError('title is too long', 422);
	}
}
