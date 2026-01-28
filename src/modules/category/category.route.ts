import express from "express"
import { CategoryController } from "./category.controller"
import auth, { UserRole } from "../../middleware/auth"

const router = express.Router()

router.get("/", CategoryController.getAllCategories)

router.post("/", auth(UserRole.ADMIN),
CategoryController.createCategory
)

router.put("/:id", auth(UserRole.ADMIN), CategoryController.updatedCategory)

router.delete("/:id", auth(UserRole.ADMIN), CategoryController.deleteCategory)


export const categoryRouter = router;