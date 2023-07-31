import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import cookie from 'cookie';

import AppError from '../../errors/appError';
import { prisma, signtoken } from '../../utils';

type Data = {
	success: boolean;
	error: boolean;
	user: {
		name: string | null;
		email: string | null;
	} | null;
	token: string | null;
	message: string;
};

export default async function handler(req: Request, res: Response<Data>) {
	try {
		validateBody(req);

		const user = await prisma.user.findUniqueOrThrow({
			where: {
				email: req.body.email,
			},

			select: {
				name: true,
				password: true,
				email: true,
			},
		});

		const isCorrect = await bcrypt.compare(req.body.password, user.password);

		if (!isCorrect) throw new AppError('invalid email or password', 401);

		const token = signtoken({
			email: user.email,
			name: user.name,
		});

		const maxAgeInSeconds = 24 * 60 * 60;
		const options = {
			maxAge: maxAgeInSeconds,
			httpOnly: false,
			secure: false,
			path: '/',
		};

		const cookieString = cookie.serialize('jwt', token, options);
		res.setHeader('Set-Cookie', cookieString);
		res.setHeader('Authorization', `Bearer ${token}`);

		res.status(200).json({
			success: true,
			error: false,
			user: {
				name: user.name,
				email: user.email,
			},
			token: token,
			message: 'user logged in',
		});
	} catch (err: unknown) {
		console.log(err);
		if (err instanceof AppError) {
			res.status(err.statusCode).json({
				success: false,
				error: true,
				user: null,
				token: null,
				message: err.message,
			});

			return;
		}

		if (err instanceof Prisma.PrismaClientKnownRequestError) {
			if (err.code === 'P2025') {
				res.status(404).json({
					success: false,
					error: true,
					token: null,
					message: 'no user found',
					user: null,
				});
				return;
			}
		}
		res.status(500).json({
			success: false,
			error: true,
			token: null,
			user: null,
			message: 'internal server error',
		});
	} finally {
		await prisma.$disconnect();
	}
}

function validateBody(req: Request) {
	let missingFields = [];
	let isError: boolean = false;

	if (!req.body?.email) {
		missingFields.push('email');
		isError = true;
	}

	if (!req.body?.password) {
		missingFields.push('password');
		isError = true;
	}

	if (isError)
		throw new AppError(
			`${missingFields?.join(',')} is missing from the body`,
			400
		);

	if (!req.body?.email?.includes('@') || !req.body?.email?.includes('.com')) {
		throw new AppError('invalid email address', 422);
	}

	if (req.body?.password?.length < 8)
		throw new AppError('password is too short', 422);
}
