import express, {Request, Response} from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

router.get('/:invitationId', async (req: Request, res: Response) => {
    const invitationId = req.params.invitationId;
    try {
        const data = await auth.api.acceptInvitation({
            body: {
                invitationId
            },
            headers: await fromNodeHeaders(req.headers)
        });

        console.log(data);
        res.redirect(`${CLIENT_URL}/dashboard`);
    } catch (error) {
        console.error(error);
        res.redirect(`${CLIENT_URL}/dashboard`);
    }
});

export default router;