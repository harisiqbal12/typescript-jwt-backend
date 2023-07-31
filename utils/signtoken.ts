import jwt from 'jsonwebtoken';

const signToken = ({ ...user }: { name: string; email: string }) => {
	const secret = process.env.JWTSECRET || '';

	return jwt.sign(
		{
			user,
		},
		secret,
		{
			expiresIn: '24h',
		}
	);
};

export default signToken;
