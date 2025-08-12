import express from 'express';
import * as candidateController from '../controllers/candidateController';

const router = express.Router();

router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidateById);
router.post('/', candidateController.createCandidate);
router.put('/:id', candidateController.updateCandidate);
router.delete('/:id', candidateController.deleteCandidate);
router.post('/batch', candidateController.createCandidatesInBatch);
router.patch('/:id/status', candidateController.updateCandidateStatus);
router.get('/batch/:batchId', candidateController.getCandidatesByBatchId);

export default router;