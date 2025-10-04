import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Generic validation middleware factory
export const validateSchema = (schema: z.ZodSchema, target: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataToValidate;
      
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        default:
          dataToValidate = req.body;
      }

      const validatedData = schema.parse(dataToValidate);
      
      switch (target) {
        case 'body':
          req.body = validatedData;
          break;
        case 'params':
          req.params = validatedData as any;
          break;
        case 'query':
          Object.assign(req.query, validatedData);
          break;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received
          }))
        });
      }
      
      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

// Middleware for combining multiple validations (body, params, query)
export const validateMultiple = (validations: Array<{
  schema: z.ZodSchema;
  target: 'body' | 'params' | 'query';
}>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const validation of validations) {
        let dataToValidate;
        
        switch (validation.target) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
        }

        const validatedData = validation.schema.parse(dataToValidate);
        
        switch (validation.target) {
          case 'body':
            req.body = validatedData;
            break;
          case 'params':
            req.params = validatedData as any;
            break;
          case 'query':
            Object.assign(req.query, validatedData);
            break;
        }
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received
          }))
        });
      }
      
      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};
