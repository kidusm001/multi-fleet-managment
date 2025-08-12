import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, CandidateStatus } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();

// Get all candidates
export const getAllCandidates: RequestHandler = async (req, res, next) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        batch: true, // Include batch information
        reviewedBy: { select: { email: true } }, // Include reviewer's email
      },
    });
    res.json(candidates);
  } catch (error) {
    next(error);
  }
};

// Get a single candidate by ID
export const getCandidateById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { batch: true, reviewedBy: { select: { email: true } } },
    });

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    res.json(candidate);
  } catch (error) {
    next(error);
  }
};

// Create a new candidate
export const createCandidate: RequestHandler = async (req, res, next) => {
  try {
    const {
      batchId,
      name,
      contact,
      email,
      department,
      location,
      status,
      isDuplicate,
      duplicateOfId,
    } = req.body;

    // Basic validation (you should have more robust validation)
    if (!name || !contact || !location) {
      res.status(400).json({ error: 'Name, contact, and location are required' });
      return;
    }

    const newCandidate = await prisma.candidate.create({
      data: {
        batchId,
        name,
        contact,
        email,
        department,
        location,
        status,
        isDuplicate,
        duplicateOfId,
      },
      include: { batch: true },
    });

    res.status(201).json(newCandidate);
  } catch (error) {
    next(error);
  }
};

// Update a candidate
export const updateCandidate: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Update data from the request body

    // First get the candidate with batch to check batch status
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { batch: true }
    });

    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    // Update the candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
      include: { batch: true, reviewedBy: { select: { email: true } } },
    });

    // If the candidate is part of a batch that's already been reviewed, we need to update the batch status
    if (candidate.batch && candidate.batch.status === 'REVIEWED') {
      await prisma.batch.update({
        where: { id: candidate.batchId! },
        data: { 
          status: 'Needs_reReview',
          // lastEditedAt will be automatically updated by Prisma @updatedAt
        }
      });

      // TODO: Generate notification for reviewer that batch needs re-review
    }

    res.json(updatedCandidate);
  } catch (error) {
    next(error);
  }
};

// Delete a candidate
export const deleteCandidate: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.candidate.delete({ where: { id } });
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};

// Create candidates in batch
export const createCandidatesInBatch: RequestHandler = async (req, res, next) => {
  try {
    const { candidates, batchData } = req.body;  // Expect an array of candidates and batch info

    // Basic validation
    if (!Array.isArray(candidates)) {
      res.status(400).json({ error: 'Candidates must be an array' });
      return;
    }

    // Create the batch (if batchData is provided)
    let batch = null;
    if (batchData) {
      batch = await prisma.batch.create({
        data: {
          name: batchData.name, // Include the name field
          status: batchData.status || 'NEW', // Default to NEW if not provided
          submittedById: batchData.submittedById, // Required
          assignedTo: batchData.assignedTo || 'MANAGER',
        },
        include: {
          submittedBy: {
            select: { email: true, role: true },
          },
        },
      });
    }

    // Create candidates and associate them with the batch
    const createdCandidates = await Promise.all(
      candidates.map(async (candidateData: {
        name: string;
        contact: string;
        email?: string;
        department?: string;
        location: string;
        status?: CandidateStatus;
        isDuplicate?: boolean;
        duplicateOfId?: string;
      }) => {
        return prisma.candidate.create({
          data: {
            ...candidateData,
            batchId: batch ? batch.id : null, // Associate with the batch if created
            status: candidateData.status || 'PENDING_REVIEW', // Default status
          },
        });
      })
    );

    res.status(201).json({ batch, candidates: createdCandidates });
  } catch (error) {
    next(error);
  }
};

// Update candidate status (for managers)
export const updateCandidateStatus: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewedById } = req.body; // Expect status and reviewer ID

    // Validate status
    if (!Object.values(CandidateStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid candidate status' });
      return;
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: {
        status,
        reviewedById,
        reviewDate: new Date(), // Set the review date
      },
      include: { batch: true, reviewedBy: { select: { email: true } } },
    });

    // TODO: If all candidates in the batch have been reviewed, consider
    // prompting the reviewer to update the batch status to REVIEWED

    res.json(updatedCandidate);
  } catch (error) {
    next(error);
  }
};

// Get candidates by batch ID
export const getCandidatesByBatchId: RequestHandler = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    
    const candidates = await prisma.candidate.findMany({
      where: { batchId },
      include: { 
        batch: true,
        reviewedBy: { select: { email: true } }
      },
      orderBy: {
        lastEditedAt: 'desc' // Show most recently edited candidates first
      }
    });
    
    res.json(candidates);
  } catch (error) {
    next(error);
  }
};