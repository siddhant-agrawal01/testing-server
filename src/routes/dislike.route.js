import { Router } from 'express';
import {
    // getDisLikedVideos,
    toggleCommentDisLike,
    toggleVideoDisLike,
    // toggleTweetDisLike,
    boolDisLike,
    boolCommentDisLike
} from "../controllers/dislike.controller.js"
import {verifyJWT} from "../middlewares/auth.middlware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").get(toggleVideoDisLike);
router.route("/toggle/c/:commentId").get(toggleCommentDisLike);
// router.route("/toggle/t/:tweetId").get(toggleTweetDisLike);
// router.route("/videos").get(getDisLikedVideos);
router.route("/dislikebool/b/:videoId").get(boolDisLike)
router.route("/dislikecommentbool/b/:commentId").get(boolCommentDisLike)

export default router