"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("./category.service");
const createCategory = async (req, res, next) => {
    try {
        const result = await category_service_1.CategoryService.createCategory(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
const getAllCategories = async (req, res, next) => {
    try {
        const result = await category_service_1.CategoryService.getAllCategories();
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const updatedCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await category_service_1.CategoryService.updateCategory(id, req.body);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await category_service_1.CategoryService.deleteCategory(id);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.CategoryController = {
    createCategory,
    getAllCategories,
    updatedCategory,
    deleteCategory
};
