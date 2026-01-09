import express from 'express';
import { handleCarChat } from '../controller/aiController';

const router = express.Router()

router.post('/', handleCarChat)

export default router