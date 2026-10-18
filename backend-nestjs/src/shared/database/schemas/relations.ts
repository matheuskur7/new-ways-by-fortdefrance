import { userImages } from './user-images.schema.js';
import { relations } from 'drizzle-orm';
import { user, session, account } from './auth.schema.js';
import { organization, member, invitation } from './organization.schema.js';

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  images: many(userImages),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),

  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),

  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const userImageRelations = relations(userImages, ({ one }) => ({
  user: one(user, { fields: [userImages.userId], references: [user.id] }),
}));
