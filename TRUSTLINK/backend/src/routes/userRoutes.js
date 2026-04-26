import { Router } from 'express';
import * as ctrl from '../controllers/userController.js';

const router = Router();

router.get('/',                ctrl.listUsers);
router.get('/:id',             ctrl.getUser);
router.post('/:id/recalc',     ctrl.recalcScore);
router.post('/login',          ctrl.mockLogin);

export default router;
