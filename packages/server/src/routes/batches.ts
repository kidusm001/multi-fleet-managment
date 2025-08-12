import express from 'express';
import * as batchController from '../controllers/batchController';

const router = express.Router();

router.get('/', batchController.getAllBatches);
router.get('/:id', batchController.getBatchById);
router.post('/', batchController.createBatch);
router.put('/:id', batchController.updateBatch);
router.delete('/:id', batchController.deleteBatch);
router.patch('/:id/status', batchController.updateBatchStatus);
router.get('/submitter/:submitterId', batchController.getBatchesBySubmitter);
router.post('/:batchId/candidates', batchController.addCandidateToBatch);
router.delete('/:batchId/candidates/:candidateId', batchController.removeCandidateFromBatch);

export default router;