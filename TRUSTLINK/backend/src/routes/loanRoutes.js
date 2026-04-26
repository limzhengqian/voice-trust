import { Router } from 'express';
import * as ctrl from '../controllers/loanController.js';

const router = Router();

router.post('/apply',           ctrl.postApply);
router.post('/approve',         ctrl.postApprove);
router.post('/reject',          ctrl.postReject);
router.post('/repay',           ctrl.postRepay);
router.post('/default',         ctrl.postDefault);
router.get('/status/:loanId',   ctrl.getStatus);
router.get('/',                 ctrl.listForUser);

export default router;
