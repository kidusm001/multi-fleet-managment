import { Request, Response, NextFunction } from 'express';
import { PrismaClient, BatchStatus } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();

// Get all batches
export const getAllBatches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        candidates: true, // Include candidate information
        submittedBy: { select: { email: true } }, // Include submitter's email
      },
    });
    res.json(batches);
  } catch (error) {
    next(error);
  }
};

// Get a single batch by ID
export const getBatchById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { candidates: true, submittedBy: { select: { email: true } } },
    });

    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    res.json(batch);
  } catch (error) {
    next(error);
  }
};

// Create a new batch
export const createBatch: express.RequestHandler = async (req, res, next) => {
  try {
    const { name, status, submittedById, assignedTo } = req.body;

    const newBatch = await prisma.batch.create({
      data: {
        name,
        status: status || 'NEW',
        submittedById,
        assignedTo: assignedTo || 'MANAGER',
      },
      include: {
        submittedBy: { select: { email: true, role: true } }
      }
    });

    res.status(201).json(newBatch);
  } catch (error) {
    next(error);
  }
};

// Update a batch
export const updateBatch: express.RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // First, get the current batch to check its status
    const currentBatch = await prisma.batch.findUnique({
      where: { id },
      include: { candidates: true }
    });
    
    if (!currentBatch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    
    // Determine if we need to change the status based on current status
    let statusUpdate = {};
    if (currentBatch.status === 'REVIEWED') {
      statusUpdate = { status: 'Needs_reReview' };
      
// Here we would generate a notification (implementation to be added later)
      // TODO: Generate notification for reviewer that batch needs re-review
    }
    
    // Update the batch with the provided data and status change if needed
    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: {
        ...updateData,
        ...statusUpdate,
        // lastEditedAt will be automatically updated by Prisma @updatedAt
      },
      include: { candidates: true, submittedBy: { select: { email: true } } },
    });

    res.json(updatedBatch);
  } catch (error) {
    next(error);
  }
};

// Delete a batch
export const deleteBatch: express.RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Use deleteMany to remove all candidates associated with this batch first
    await prisma.candidate.deleteMany({
      where: { batchId: id }
    });
    
    // Then delete the batch itself
    await prisma.batch.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Update batch status (for managers)
export const updateBatchStatus: express.RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!Object.values(BatchStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid batch status' });
      return;
    }

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: { status },
      include: { candidates: true, submittedBy: { select: { email: true } } },
    });

    // TODO: If status is changed to REVIEWED, generate notification for the recruiter
    // that their batch has been reviewed and is ready for them to check

    res.json(updatedBatch);
  } catch (error) {
    next(error);
  }
};

// Get batches submitted by a specific user (for recruiters to view their submissions)
export const getBatchesBySubmitter: express.RequestHandler = async (req, res, next) => {
  try {
    const { submitterId } = req.params;
    
    const batches = await prisma.batch.findMany({
      where: { 
        submittedById: submitterId 
      },
      include: {
        candidates: true,
        submittedBy: { select: { email: true } },
      },
      orderBy: {
        lastEditedAt: 'desc' // Show most recently edited batches first
      }
    });
    
    res.json(batches);
  } catch (error) {
    next(error);
  }
};

// Add a candidate to an existing batch
export const addCandidateToBatch: express.RequestHandler = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const candidateData = req.body;
    
    // First, get the current batch to check its status
    const currentBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });
    
    if (!currentBatch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    
    // Create the new candidate
    const newCandidate = await prisma.candidate.create({
      data: {
        ...candidateData,
        batchId,
        status: 'PENDING_REVIEW'
      }
    });
    
    // Update batch status if it was already reviewed
    if (currentBatch.status === 'REVIEWED') {
      await prisma.batch.update({
        where: { id: batchId },
        data: { 
          status: 'Needs_reReview',
          // lastEditedAt will be automatically updated by Prisma @updatedAt
        }
      });
      
      // TODO: Generate notification for reviewer that batch needs re-review
    }
    
    res.status(201).json(newCandidate);
  } catch (error) {
    next(error);
  }
};

// Remove a candidate from a batch
export const removeCandidateFromBatch: express.RequestHandler = async (req, res, next) => {
  try {
    const { batchId, candidateId } = req.params;
    
    // First, get the current batch to check its status
    const currentBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });
    
    if (!currentBatch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    
    // Delete the candidate
    await prisma.candidate.delete({
      where: { id: candidateId }
    });
    
    // Update batch status if it was already reviewed
    if (currentBatch.status === 'REVIEWED') {
      await prisma.batch.update({
        where: { id: batchId },
        data: { 
          status: 'Needs_reReview',
          // lastEditedAt will be automatically updated by Prisma @updatedAt
        }
      });
      
      // TODO: Generate notification for reviewer that batch needs re-review
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};