import { NextFunction, Request, Response } from "express";
import { CategoryService } from "./category.service";

const createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
)=>{
    try{
        const result = await CategoryService.createCategory(req.body);
        res.status(201).json(result)
    }catch(error){
        next(error)
    }
}


const getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    try{
        const result = await CategoryService.getAllCategories()
        res.status(201).json(result)
    }catch(error){
        next(error)
    }
}


const updatedCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
)=>{
    try{
        const {id} = req.params;
        const result = await CategoryService.updateCategory(id as string, req.body)
        res.status(200).json(result);
    }catch(error){
        next(error)
    }
}


const deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const {id} = req.params;
        const result = await CategoryService.deleteCategory(id as string)
        res.status(200).json(result)
    }catch(error){
        next(error)
    }
}


export const CategoryController = {
    createCategory,
    getAllCategories,
    updatedCategory,
    deleteCategory
}