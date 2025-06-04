import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const sessionTemplates = pgTable('session_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration: integer('duration_minutes').notNull(),
  capacity: integer('capacity').notNull(),
  isOpen: boolean('is_open').notNull().default(true),
  isRecurring: boolean('is_recurring').notNull().default(false),
  oneOffStartTime: timestamp('one_off_start_time'),
  oneOffDate: timestamp('one_off_date', { mode: 'date' }),
  recurrenceStartDate: timestamp('recurrence_start_date', { mode: 'date' }),
  recurrenceEndDate: timestamp('recurrence_end_date', { mode: 'date' }),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  organizationId: uuid('organization_id'),
});

export const sessionSchedules = pgTable('session_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionTemplateId: uuid('session_template_id').references(() => sessionTemplates.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 for Sunday-Saturday
  time: text('time').notNull(), // type: time in DB, use string in TS
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types for new records
export type NewSessionTemplate = typeof sessionTemplates.$inferInsert;
export type NewSessionSchedule = typeof sessionSchedules.$inferInsert; 