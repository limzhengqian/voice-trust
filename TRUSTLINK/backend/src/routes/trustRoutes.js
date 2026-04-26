import { Router } from 'express';
import * as ctrl from '../controllers/trustController.js';

const router = Router();

router.post('/request',          ctrl.postTrustRequest);
router.post('/accept',           ctrl.postTrustAccept);
router.post('/reject',           ctrl.postTrustReject);
router.post('/relationship',     ctrl.postRelationshipUpdate);
router.get('/requests',          ctrl.getTrustRequests);
router.get('/network/:userId',   ctrl.getTrustNetwork);
router.get('/strength/:userId',  ctrl.getTrustStrength);

export default router;
