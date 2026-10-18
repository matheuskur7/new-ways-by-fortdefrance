import { pgEnum } from 'drizzle-orm/pg-core';

export const imageStatus = pgEnum('image_status', ['pending', 'ready']);
