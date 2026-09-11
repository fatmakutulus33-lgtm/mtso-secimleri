import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const votes=sqliteTable('votes',{voter:text('voter').notNull(),groupId:integer('group_id').notNull(),listId:text('list_id').notNull(),createdAt:text('created_at').notNull()},t=>[primaryKey({columns:[t.voter,t.groupId]}),index('idx_votes_list').on(t.listId)]);
