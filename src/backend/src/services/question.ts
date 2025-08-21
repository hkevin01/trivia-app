import { Request, Response } from 'express';
import { dbManager } from '../database/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export interface QuestionData {
  id?: string;
  categoryId?: string;
  type: 'MCQ' | 'TEXT' | 'NUMERIC' | 'TRUE_FALSE';
  questionText: string;
  choices?: string[];
  correctAnswer: any;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  points?: number;
  tags?: string[];
}

export interface QuestionFilter {
  categoryId?: string;
  difficulty?: string;
  type?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export class QuestionService {
  static async createQuestion(
    questionData: QuestionData,
    authorId: string
  ): Promise<any> {
    const {
      categoryId,
      type,
      questionText,
      choices,
      correctAnswer,
      explanation,
      difficulty = 'medium',
      timeLimit = 30,
      points = 100,
      tags = [],
    } = questionData;

    // Validate question data
    await this.validateQuestionData(questionData);

    const questionId = randomUUID();

    const result = await dbManager.query(
      `
      INSERT INTO questions (
        id, author_user_id, category_id, type, question_text,
        choices, correct_answer, explanation, difficulty,
        time_limit, points, tags, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        questionId,
        authorId,
        categoryId,
        type,
        questionText,
        choices ? JSON.stringify(choices) : null,
        JSON.stringify(correctAnswer),
        explanation,
        difficulty,
        timeLimit,
        points,
        tags,
        true,
      ]
    );

    logger.info(`Question created: ${questionId} by user ${authorId}`);
    return this.formatQuestion(result.rows[0]);
  }

  static async getQuestion(questionId: string): Promise<any> {
    const result = await dbManager.query(
      `
      SELECT q.*, qc.name as category_name, u.username as author_username
      FROM questions q
      LEFT JOIN question_categories qc ON q.category_id = qc.id
      LEFT JOIN users u ON q.author_user_id = u.id
      WHERE q.id = $1 AND q.is_active = true
    `,
      [questionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Question not found');
    }

    return this.formatQuestion(result.rows[0]);
  }

  static async getQuestions(filter: QuestionFilter = {}): Promise<any> {
    const {
      categoryId,
      difficulty,
      type,
      tags,
      search,
      page = 1,
      limit = 20,
    } = filter;

    let whereConditions = ['q.is_active = true'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (categoryId) {
      whereConditions.push(`q.category_id = $${paramIndex}`);
      queryParams.push(categoryId);
      paramIndex++;
    }

    if (difficulty) {
      whereConditions.push(`q.difficulty = $${paramIndex}`);
      queryParams.push(difficulty);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`q.type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      whereConditions.push(`q.tags && $${paramIndex}`);
      queryParams.push(tags);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(q.question_text ILIKE $${paramIndex} OR q.explanation ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    const query = `
      SELECT q.*, qc.name as category_name, u.username as author_username,
             COUNT(*) OVER() as total_count
      FROM questions q
      LEFT JOIN question_categories qc ON q.category_id = qc.id
      LEFT JOIN users u ON q.author_user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY q.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await dbManager.query(query, queryParams);

    const questions = result.rows.map((row: any) => this.formatQuestion(row));
    const totalCount =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return {
      questions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  static async updateQuestion(
    questionId: string,
    questionData: Partial<QuestionData>,
    authorId: string
  ): Promise<any> {
    // First check if question exists and user owns it
    const existingQuestion = await dbManager.query(
      'SELECT author_user_id FROM questions WHERE id = $1 AND is_active = true',
      [questionId]
    );

    if (existingQuestion.rows.length === 0) {
      throw new Error('Question not found');
    }

    if (existingQuestion.rows[0].author_user_id !== authorId) {
      throw new Error('Unauthorized to update this question');
    }

    // Validate updated data
    if (Object.keys(questionData).length > 0) {
      await this.validateQuestionData(questionData);
    }

    const allowedFields = [
      'category_id',
      'type',
      'question_text',
      'choices',
      'correct_answer',
      'explanation',
      'difficulty',
      'time_limit',
      'points',
      'tags',
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(questionData)) {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

      if (allowedFields.includes(dbField) && value !== undefined) {
        if (field === 'choices' || field === 'correctAnswer') {
          updateFields.push(`${dbField} = $${paramIndex}`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramIndex}`);
          updateValues.push(value);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(questionId);

    const result = await dbManager.query(
      `
      UPDATE questions
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
      updateValues
    );

    logger.info(`Question updated: ${questionId} by user ${authorId}`);
    return this.formatQuestion(result.rows[0]);
  }

  static async deleteQuestion(
    questionId: string,
    authorId: string
  ): Promise<void> {
    // Check if question exists and user owns it
    const existingQuestion = await dbManager.query(
      'SELECT author_user_id FROM questions WHERE id = $1 AND is_active = true',
      [questionId]
    );

    if (existingQuestion.rows.length === 0) {
      throw new Error('Question not found');
    }

    if (existingQuestion.rows[0].author_user_id !== authorId) {
      throw new Error('Unauthorized to delete this question');
    }

    // Soft delete
    await dbManager.query(
      'UPDATE questions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [questionId]
    );

    logger.info(`Question deleted: ${questionId} by user ${authorId}`);
  }

  static async getRandomQuestions(
    categoryId?: string,
    difficulty?: string,
    count: number = 10
  ): Promise<any[]> {
    let whereConditions = ['q.is_active = true'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (categoryId) {
      whereConditions.push(`q.category_id = $${paramIndex}`);
      queryParams.push(categoryId);
      paramIndex++;
    }

    if (difficulty) {
      whereConditions.push(`q.difficulty = $${paramIndex}`);
      queryParams.push(difficulty);
      paramIndex++;
    }

    queryParams.push(count);

    const query = `
      SELECT q.*, qc.name as category_name
      FROM questions q
      LEFT JOIN question_categories qc ON q.category_id = qc.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY RANDOM()
      LIMIT $${paramIndex}
    `;

    const result = await dbManager.query(query, queryParams);
    return result.rows.map((row: any) => this.formatQuestion(row));
  }

  static async validateQuestionData(
    questionData: Partial<QuestionData>
  ): Promise<void> {
    const { type, choices, correctAnswer, questionText } = questionData;

    if (
      questionText &&
      (questionText.trim().length < 10 || questionText.length > 1000)
    ) {
      throw new Error('Question text must be between 10 and 1000 characters');
    }

    if (type) {
      if (!['MCQ', 'TEXT', 'NUMERIC', 'TRUE_FALSE'].includes(type)) {
        throw new Error('Invalid question type');
      }

      if ((type === 'MCQ' || type === 'TRUE_FALSE') && choices) {
        if (
          !Array.isArray(choices) ||
          choices.length < 2 ||
          choices.length > 10
        ) {
          throw new Error(
            'MCQ and TRUE_FALSE questions must have 2-10 choices'
          );
        }

        if (choices.some((choice) => !choice || choice.trim().length === 0)) {
          throw new Error('All choices must be non-empty');
        }

        if (type === 'TRUE_FALSE' && choices.length !== 2) {
          throw new Error('TRUE_FALSE questions must have exactly 2 choices');
        }
      }

      if (type === 'MCQ' && correctAnswer) {
        if (choices && !choices.includes(correctAnswer)) {
          throw new Error('Correct answer must be one of the provided choices');
        }
      }

      if (type === 'NUMERIC' && correctAnswer !== undefined) {
        if (isNaN(Number(correctAnswer))) {
          throw new Error(
            'Correct answer for NUMERIC questions must be a number'
          );
        }
      }
    }
  }

  static formatQuestion(row: any): any {
    return {
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      authorUsername: row.author_username,
      type: row.type,
      questionText: row.question_text,
      choices: row.choices ? JSON.parse(row.choices) : null,
      correctAnswer: JSON.parse(row.correct_answer),
      explanation: row.explanation,
      difficulty: row.difficulty,
      timeLimit: row.time_limit,
      points: row.points,
      tags: row.tags || [],
      usageCount: row.usage_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Question Controllers
export const createQuestion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const questionData = req.body as QuestionData;
    const question = await QuestionService.createQuestion(
      questionData,
      req.user.id
    );

    res.status(201).json({
      message: 'Question created successfully',
      question,
    });
  } catch (error: any) {
    logger.error('Create question error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create question',
    });
  }
};

export const getQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { questionId } = req.params;
    const question = await QuestionService.getQuestion(questionId);

    res.json({ question });
  } catch (error: any) {
    logger.error('Get question error:', error);
    res.status(404).json({
      error: error.message || 'Question not found',
    });
  }
};

export const getQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const filter: QuestionFilter = {
      categoryId: req.query.categoryId as string,
      difficulty: req.query.difficulty as string,
      type: req.query.type as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await QuestionService.getQuestions(filter);
    res.json(result);
  } catch (error: any) {
    logger.error('Get questions error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch questions',
    });
  }
};

export const updateQuestion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionId } = req.params;
    const questionData = req.body as Partial<QuestionData>;

    const question = await QuestionService.updateQuestion(
      questionId,
      questionData,
      req.user.id
    );

    res.json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error: any) {
    logger.error('Update question error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update question',
    });
  }
};

export const deleteQuestion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { questionId } = req.params;
    await QuestionService.deleteQuestion(questionId, req.user.id);

    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    logger.error('Delete question error:', error);
    res.status(400).json({
      error: error.message || 'Failed to delete question',
    });
  }
};

export const getRandomQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = req.query.categoryId as string;
    const difficulty = req.query.difficulty as string;
    const count = req.query.count ? parseInt(req.query.count as string) : 10;

    const questions = await QuestionService.getRandomQuestions(
      categoryId,
      difficulty,
      count
    );

    res.json({ questions });
  } catch (error: any) {
    logger.error('Get random questions error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch random questions',
    });
  }
};
