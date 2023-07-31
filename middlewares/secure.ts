import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

import { prisma } from '../utils';
import AppError from '../errors/appError';

type Data = {
	success: boolean;
	error: boolean;
	message: string | null;
};

export default async function handler(
	req: Request,
	res: Response<Data>,
	next: NextFunction
) {
	try {
		let token: string = '';
		const secret: string = process.env.JWTSECRET || '';

		if (
			req?.headers?.authorization &&
			req?.headers?.authorization?.startsWith('Bearer')
		) {
			token = req.headers.authorization.split(' ')[1];
		}

		if (req.cookies?.jwt) {
			token = req.cookies.jwt;
		}

		if (!token) {
			throw new AppError('please logged in first', 401);
		}

		const decoded: jwt.Jwt = await new Promise((resolve, reject) => {
			jwt.verify(token, secret, { complete: true }, (err, decoded) => {
				if (err) reject(err);

				resolve(decoded as jwt.Jwt);
			});
		});

		// if user decided to update it's credential like email, name because of that have to verify from DB
		const user = await prisma.user.findUniqueOrThrow({
			where: {
				//@ts-ignore
				email: decoded.payload?.user?.email || undefined,
			},

			select: {
				id: true,
			},
		});

		Object.assign(req, {
			user,
		});

		next();
	} catch (err: unknown) {
		console.log(err);
		if (err instanceof AppError) {
			res.status(err.statusCode).json({
				success: false,
				error: true,
				message: err?.message,
			});
			return;
		}

		if (err instanceof Prisma.PrismaClientKnownRequestError) {
			if (err.code === 'P2025') {
				res.status(404).json({
					success: false,
					error: true,
					message: 'user not found',
				});

				return;
			}
		}

		res.status(500).json({
			success: false,
			error: true,
			message: 'internal server error',
		});

		await prisma.$disconnect();
	}
}
