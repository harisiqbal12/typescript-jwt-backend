import { Request, Response } from 'express';
import { prisma } from '../../utils';

type R = Request & {
	user?: {
		id: string;
	};
};

type Data = {
	success: boolean;
	error: boolean;
	posts: Array<{
		id: string;
		user: {
			name: string;
			email: string;
		};
		title: string;
		description?: string | null;
		createdAt: unknown;
	}>;
	message: string | null;
};

export default async function handler(req: R, res: Response<Data>) {
	try {
		const posts = await prisma.posts.findMany({
			where: {
				user_id: req.user?.id,
			},

			select: {
				id: true,
				user: {
					select: {
						name: true,
						email: true,
					},
				},

				title: true,
				description: true,
				createdAt: true,
			},
		});

		res.status(200).json({
			success: true,
			error: false,
			posts,
			message: null,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: true,
			message: 'internal server error',
			posts: [],
		});
	} finally {
		await prisma.$disconnect();
	}
}
