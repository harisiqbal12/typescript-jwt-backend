import express from 'express';

import { user } from '../controllers';

const router = express.Router();

router.route('/signup').post(user.signup);
router.route('/login').post(user.login);

export default router;
