import express from 'express';
const router = express.Router();

// Recruitment feature removed
router.all('*', (_req, res) => res.status(404).json({ error: 'Not found' }));

export default router;