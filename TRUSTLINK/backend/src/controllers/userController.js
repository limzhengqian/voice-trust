import * as userModel from '../models/userModel.js';
import { recalcTrustScore, borrowingPowerFromScore, tierFromScore } from '../services/trustScoreService.js';

export async function listUsers(req, res, next) {
  try {
    const users = await userModel.listUsers();
    res.json(users);
  } catch (e) { next(e); }
}

export async function getUser(req, res, next) {
  try {
    const u = await userModel.getUser(req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...u,
      tier: tierFromScore(u.trust_score),
      borrowing_power: borrowingPowerFromScore(u.trust_score),
    });
  } catch (e) { next(e); }
}

export async function recalcScore(req, res, next) {
  try {
    const out = await recalcTrustScore(req.params.id);
    res.json(out);
  } catch (e) { next(e); }
}

// Mock login: accepts {user_id} and returns the user record. No password.
export async function mockLogin(req, res, next) {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const u = await userModel.getUser(user_id);
    if (!u) return res.status(404).json({ error: 'Mock user not found' });
    res.json({
      token: `mock.${user_id}.${Date.now()}`,
      user: {
        ...u,
        tier: tierFromScore(u.trust_score),
        borrowing_power: borrowingPowerFromScore(u.trust_score),
      },
    });
  } catch (e) { next(e); }
}
