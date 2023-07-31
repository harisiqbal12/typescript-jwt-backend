import { Router } from 'express';
import userRouter from './user.router';
import postRouter from './posts.router';

const router = Router();

router.route('/').get((req, res) => {
	res.status(200).send('<h1>Ace On Technology Assesment</h1>');
});

router.use('/api', userRouter);
router.use('/api', postRouter);

export default router;
