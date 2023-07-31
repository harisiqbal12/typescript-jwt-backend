import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import cookie from 'cookie';

import AppError from '../../errors/appError';
import { prisma, signtoken } from '../../utils';

type Data = {
	success: boolean;
	error: boolean;
	message: string | null;

	token: string | null;
	user: {
		name: string | null;
		email: string | null;
		password: string | null;
		photoURI: string | null;
	} | null;
};

export default async function handler(req: Request, res: Response<Data>) {
	try {
		validateBody(req);

		const existedUser = await prisma.user.findUnique({
			where: {
				email: req.body.email,
			},

			select: {
				email: true,
			},
		});

		if (existedUser?.email) throw new AppError('user already exists', 409);

		const encryptedUser = await bcrypt.hash(
			req.body.password,
			process.env.PASSWORDSALT as string
		);

		const user = await prisma.user.create({
			data: {
				name: req.body.name,
				email: req.body.email,
				password: encryptedUser,
				photoURI: req.body.photoURI || null,
			},

			select: {
				name: true,
				email: true,
				password: true,
				photoURI: true,
			},
		});

		const token = signtoken({ name: user.name, email: user.email });

		const maxAgeInSeconds = 24 * 60 * 60;
		const options = {
			maxAge: maxAgeInSeconds,
			httpOnly: false,
			secure: false,
			path: '/',
		}; // this options represents development environment setup

		const cookieString = cookie.serialize('jwt', token, options);
		res.setHeader('Set-Cookie', cookieString);
		res.setHeader('Authorization', `Bearer ${token}`);

		res.status(200).json({
			success: true,
			message: 'user created',
			error: false,
			token: token,
			user,
		});
	} catch (err: unknown) {
		console.log(err);
		if (err instanceof AppError) {
			res.status(err.statusCode).json({
				success: false,
				error: true,
				message: err.message,
				user: null,
				token: null,
			});

			return;
		}

		res.status(500).json({
			success: false,
			error: true,
			message: 'internal server error',
			user: null,
			token: null,
		});
	} finally {
		await prisma.$disconnect();
	}
}

function validateBody(req: Request) {
	let missingFields = [];
	let isError: boolean = false;

	if (!req.body?.name) {
		missingFields.push('name');
		isError = true;
	}

	if (!req.body?.email) {
		missingFields?.push('email');
		isError = true;
	}

	if (!req.body?.password) {
		missingFields?.push('password');
		isError = true;
	}

	if (isError)
		throw new AppError(
			`${missingFields?.join(',')} is missing from the body`,
			400
		);

	if (!req.body?.email?.includes('@') || !req.body?.email?.includes('.com'))
		throw new AppError('invalid email entity', 422);

	if (req.body?.password?.length < 8)
		throw new AppError('password is too short', 422);
}
