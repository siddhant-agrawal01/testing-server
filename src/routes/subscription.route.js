import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlware.js';
import {
    getSubscribedChannels,
    getUserChannelSubscribers, 
    toggleSubscription,
    isSubscribed
} from '../controllers/subscription.controller.js'

const router = Router()

router.use(verifyJWT)

router.route("/c/:userId").get(toggleSubscription)
router.route("/d/:userId").get(getSubscribedChannels)
router.route("/u/:userId").get(getUserChannelSubscribers)
router.route("/s/:userId").get(isSubscribed)

export default router