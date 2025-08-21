import { Request, Response } from 'express';
import { dbManager } from '../database/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export interface CategoryData {
  id?: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export class CategoryService {
  static async createCategory(categoryData: CategoryData): Promise<any> {
    const { name, description, iconUrl } = categoryData;

    // Check if category with same name exists
    const existingCategory = await dbManager.query(
      'SELECT id FROM question_categories WHERE name = $1 AND is_active = true',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      throw new Error('Category with this name already exists');
    }

    const categoryId = randomUUID();

    const result = await dbManager.query(
      `
      INSERT INTO question_categories (id, name, description, icon_url, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [categoryId, name, description, iconUrl, true]
    );

    logger.info(`Category created: ${categoryId} - ${name}`);
    return this.formatCategory(result.rows[0]);
  }

  static async getCategory(categoryId: string): Promise<any> {
    const result = await dbManager.query(
      `
      SELECT c.*, COUNT(q.id) as question_count
      FROM question_categories c
      LEFT JOIN questions q ON c.id = q.category_id AND q.is_active = true
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, c.name, c.description, c.icon_url, c.is_active, c.created_at
    `,
      [categoryId]
    );

    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    return this.formatCategory(result.rows[0]);
  }

  static async getCategories(): Promise<any[]> {
    const result = await dbManager.query(`
      SELECT c.*, COUNT(q.id) as question_count
      FROM question_categories c
      LEFT JOIN questions q ON c.id = q.category_id AND q.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.description, c.icon_url, c.is_active, c.created_at
      ORDER BY c.name ASC
    `);

    return result.rows.map((row: any) => this.formatCategory(row));
  }

  static async updateCategory(
    categoryId: string,
    categoryData: Partial<CategoryData>
  ): Promise<any> {
    // Check if category exists
    const existingCategory = await dbManager.query(
      'SELECT id FROM question_categories WHERE id = $1 AND is_active = true',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      throw new Error('Category not found');
    }

    // Check for name conflicts if name is being updated
    if (categoryData.name) {
      const nameConflict = await dbManager.query(
        'SELECT id FROM question_categories WHERE name = $1 AND id != $2 AND is_active = true',
        [categoryData.name, categoryId]
      );

      if (nameConflict.rows.length > 0) {
        throw new Error('Category with this name already exists');
      }
    }

    const allowedFields = ['name', 'description', 'icon_url'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(categoryData)) {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

      if (allowedFields.includes(dbField) && value !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(categoryId);

    const result = await dbManager.query(
      `
      UPDATE question_categories
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      updateValues
    );

    logger.info(`Category updated: ${categoryId}`);
    return this.formatCategory(result.rows[0]);
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    // Check if category exists
    const existingCategory = await dbManager.query(
      'SELECT id FROM question_categories WHERE id = $1 AND is_active = true',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      throw new Error('Category not found');
    }

    // Check if category has associated questions
    const questionsInCategory = await dbManager.query(
      'SELECT COUNT(*) as count FROM questions WHERE category_id = $1 AND is_active = true',
      [categoryId]
    );

    if (parseInt(questionsInCategory.rows[0].count) > 0) {
      throw new Error('Cannot delete category with associated questions');
    }

    // Soft delete
    await dbManager.query(
      'UPDATE question_categories SET is_active = false WHERE id = $1',
      [categoryId]
    );

    logger.info(`Category deleted: ${categoryId}`);
  }

  static formatCategory(row: any): any {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      iconUrl: row.icon_url,
      questionCount: parseInt(row.question_count || 0),
      createdAt: row.created_at,
    };
  }
}

// Category Controllers
export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isHost) {
      res.status(403).json({ error: 'Host privileges required' });
      return;
    }

    const categoryData = req.body as CategoryData;
    const category = await CategoryService.createCategory(categoryData);

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error: any) {
    logger.error('Create category error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create category',
    });
  }
};

export const getCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const category = await CategoryService.getCategory(categoryId);

    res.json({ category });
  } catch (error: any) {
    logger.error('Get category error:', error);
    res.status(404).json({
      error: error.message || 'Category not found',
    });
  }
};

export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await CategoryService.getCategories();
    res.json({ categories });
  } catch (error: any) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch categories',
    });
  }
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isHost) {
      res.status(403).json({ error: 'Host privileges required' });
      return;
    }

    const { categoryId } = req.params;
    const categoryData = req.body as Partial<CategoryData>;

    const category = await CategoryService.updateCategory(
      categoryId,
      categoryData
    );

    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error: any) {
    logger.error('Update category error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update category',
    });
  }
};

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.isHost) {
      res.status(403).json({ error: 'Host privileges required' });
      return;
    }

    const { categoryId } = req.params;
    await CategoryService.deleteCategory(categoryId);

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    logger.error('Delete category error:', error);
    res.status(400).json({
      error: error.message || 'Failed to delete category',
    });
  }
};
