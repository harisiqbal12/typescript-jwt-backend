import express from 'express';

import { post } from '../controllers';
import { secure, limiter } from '../middlewares';

const router = express.Router();

router.use('/posts', secure);
router.use('/posts', limiter)

router
	.route('/posts')
	.post(post.createPost)
	.get(post.getAll)
	.put(post.updatePost)
	.delete(post.deletePost);

export default router;
