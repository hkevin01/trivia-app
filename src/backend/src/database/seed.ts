import { dbManager } from './connection.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

interface SeedData {
  users: any[];
  categories: any[];
  questions: any[];
}

class DatabaseSeeder {
  private data: SeedData = {
    users: [
      {
        id: randomUUID(),
        email: 'admin@quizrally.com',
        username: 'admin',
        password: 'AdminPassword123!',
        display_name: 'Administrator',
        is_verified: true,
        is_host: true,
      },
      {
        id: randomUUID(),
        email: 'host@quizrally.com',
        username: 'testhost',
        password: 'HostPassword123!',
        display_name: 'Test Host',
        is_verified: true,
        is_host: true,
      },
      {
        id: randomUUID(),
        email: 'player@quizrally.com',
        username: 'testplayer',
        password: 'PlayerPassword123!',
        display_name: 'Test Player',
        is_verified: true,
        is_host: false,
      },
    ],
    categories: [
      {
        id: randomUUID(),
        name: 'General Knowledge',
        description: 'A mix of questions from various topics',
        icon_url: null,
      },
      {
        id: randomUUID(),
        name: 'Science',
        description: 'Questions about physics, chemistry, biology, and more',
        icon_url: null,
      },
      {
        id: randomUUID(),
        name: 'History',
        description: 'Questions about world history and historical events',
        icon_url: null,
      },
      {
        id: randomUUID(),
        name: 'Sports',
        description: 'Questions about various sports and athletes',
        icon_url: null,
      },
      {
        id: randomUUID(),
        name: 'Entertainment',
        description: 'Questions about movies, music, TV shows, and celebrities',
        icon_url: null,
      },
    ],
    questions: [],
  };

  constructor() {
    this.generateSampleQuestions();
  }

  private generateSampleQuestions(): void {
    const categories = this.data.categories;
    const users = this.data.users;
    const adminUser = users[0]; // Use admin as question author

    // General Knowledge questions
    this.data.questions.push(
      {
        id: randomUUID(),
        author_user_id: adminUser.id,
        category_id: categories[0].id,
        type: 'MCQ',
        question_text: 'What is the capital of France?',
        choices: JSON.stringify(['London', 'Berlin', 'Paris', 'Madrid']),
        correct_answer: JSON.stringify('Paris'),
        explanation:
          'Paris has been the capital of France since the 12th century.',
        difficulty: 'easy',
        time_limit: 30,
        points: 100,
        tags: ['geography', 'europe', 'capitals'],
      },
      {
        id: randomUUID(),
        author_user_id: adminUser.id,
        category_id: categories[0].id,
        type: 'TRUE_FALSE',
        question_text: 'The Great Wall of China is visible from space.',
        choices: JSON.stringify(['True', 'False']),
        correct_answer: JSON.stringify('False'),
        explanation:
          'This is a common myth. The Great Wall is not visible from space with the naked eye.',
        difficulty: 'medium',
        time_limit: 20,
        points: 150,
        tags: ['china', 'space', 'mythology'],
      }
    );

    // Science questions
    this.data.questions.push(
      {
        id: randomUUID(),
        author_user_id: adminUser.id,
        category_id: categories[1].id,
        type: 'MCQ',
        question_text: 'What is the chemical symbol for gold?',
        choices: JSON.stringify(['Go', 'Gd', 'Au', 'Ag']),
        correct_answer: JSON.stringify('Au'),
        explanation: 'Au comes from the Latin word "aurum" meaning gold.',
        difficulty: 'medium',
        time_limit: 25,
        points: 150,
        tags: ['chemistry', 'elements', 'symbols'],
      },
      {
        id: randomUUID(),
        author_user_id: adminUser.id,
        category_id: categories[1].id,
        type: 'NUMERIC',
        question_text: 'How many bones are in an adult human body?',
        choices: null,
        correct_answer: JSON.stringify(206),
        explanation:
          'An adult human has 206 bones, while babies are born with about 270 bones.',
        difficulty: 'hard',
        time_limit: 45,
        points: 200,
        tags: ['biology', 'anatomy', 'human-body'],
      }
    );

    // History questions
    this.data.questions.push({
      id: randomUUID(),
      author_user_id: adminUser.id,
      category_id: categories[2].id,
      type: 'MCQ',
      question_text: 'In which year did World War II end?',
      choices: JSON.stringify(['1944', '1945', '1946', '1947']),
      correct_answer: JSON.stringify('1945'),
      explanation:
        'World War II ended in 1945 with the surrender of Japan in September.',
      difficulty: 'easy',
      time_limit: 30,
      points: 100,
      tags: ['world-war', 'dates', '20th-century'],
    });

    // Sports questions
    this.data.questions.push({
      id: randomUUID(),
      author_user_id: adminUser.id,
      category_id: categories[3].id,
      type: 'MCQ',
      question_text:
        'How many players are on a basketball team on the court at one time?',
      choices: JSON.stringify(['4', '5', '6', '7']),
      correct_answer: JSON.stringify('5'),
      explanation:
        'Basketball teams have 5 players on the court: point guard, shooting guard, small forward, power forward, and center.',
      difficulty: 'easy',
      time_limit: 20,
      points: 100,
      tags: ['basketball', 'team-sports', 'rules'],
    });

    // Entertainment questions
    this.data.questions.push({
      id: randomUUID(),
      author_user_id: adminUser.id,
      category_id: categories[4].id,
      type: 'MCQ',
      question_text:
        'Which movie won the Academy Award for Best Picture in 2020?',
      choices: JSON.stringify([
        '1917',
        'Joker',
        'Parasite',
        'Once Upon a Time in Hollywood',
      ]),
      correct_answer: JSON.stringify('Parasite'),
      explanation:
        'Parasite, directed by Bong Joon-ho, was the first non-English film to win Best Picture.',
      difficulty: 'medium',
      time_limit: 35,
      points: 150,
      tags: ['movies', 'oscars', 'awards'],
    });
  }

  async seedUsers(): Promise<void> {
    logger.info('Seeding users...');

    for (const user of this.data.users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);

      await dbManager.query(
        `
        INSERT INTO users (id, email, username, password_hash, display_name, is_verified, is_host)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `,
        [
          user.id,
          user.email,
          user.username,
          hashedPassword,
          user.display_name,
          user.is_verified,
          user.is_host,
        ]
      );
    }

    logger.info(`Seeded ${this.data.users.length} users`);
  }

  async seedCategories(): Promise<void> {
    logger.info('Seeding categories...');

    for (const category of this.data.categories) {
      await dbManager.query(
        `
        INSERT INTO question_categories (id, name, description, icon_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `,
        [category.id, category.name, category.description, category.icon_url]
      );
    }

    logger.info(`Seeded ${this.data.categories.length} categories`);
  }

  async seedQuestions(): Promise<void> {
    logger.info('Seeding questions...');

    for (const question of this.data.questions) {
      await dbManager.query(
        `
        INSERT INTO questions (
          id, author_user_id, category_id, type, question_text,
          choices, correct_answer, explanation, difficulty,
          time_limit, points, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          question.id,
          question.author_user_id,
          question.category_id,
          question.type,
          question.question_text,
          question.choices,
          question.correct_answer,
          question.explanation,
          question.difficulty,
          question.time_limit,
          question.points,
          question.tags,
        ]
      );
    }

    logger.info(`Seeded ${this.data.questions.length} questions`);
  }

  async seedAll(): Promise<void> {
    try {
      await dbManager.connect();

      logger.info('Starting database seeding...');

      await this.seedUsers();
      await this.seedCategories();
      await this.seedQuestions();

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new DatabaseSeeder();

  seeder
    .seedAll()
    .then(() => {
      logger.info('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding process failed:', error);
      process.exit(1);
    });
}

export { DatabaseSeeder };
