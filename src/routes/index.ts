import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import postsRoutes from "./posts.routes";
import commentsRoutes from "./comments.routes";
import statsRoutes from "./stats.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/posts", postsRoutes);
router.use("/comments", commentsRoutes);
router.use("/stats", statsRoutes);

export default router;
