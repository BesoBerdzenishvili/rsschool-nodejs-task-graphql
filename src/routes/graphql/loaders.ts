import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function createLoaders(prisma: PrismaClient) {
  const userById = new DataLoader<string, any>(async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));
    return ids.map((id) => userMap.get(id) || null);
  });

  const postsByAuthorId = new DataLoader<string, any[]>(async (authorIds) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...authorIds] } },
    });
    const postsByAuthor = new Map<string, any[]>();

    authorIds.forEach((id) => postsByAuthor.set(id, []));

    posts.forEach((post) => {
      const authorPosts = postsByAuthor.get(post.authorId);
      if (authorPosts) {
        authorPosts.push(post);
      }
    });

    return authorIds.map((id) => postsByAuthor.get(id) || []);
  });

  const profileByUserId = new DataLoader<string, any>(async (userIds) => {
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: [...userIds] } },
    });
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
    return userIds.map((id) => profileMap.get(id) || null);
  });

  const memberTypeById = new DataLoader<string, any>(async (ids) => {
    const memberTypes = await prisma.memberType.findMany({
      where: { id: { in: [...ids] } },
    });
    const memberTypeMap = new Map(memberTypes.map((mt) => [mt.id, mt]));
    return ids.map((id) => memberTypeMap.get(id) || null);
  });

  const userSubscribedTo = new DataLoader<string, any[]>(async (subscriberIds) => {
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { subscriberId: { in: [...subscriberIds] } },
      include: { author: true },
    });

    const subscriptionsBySubscriber = new Map<string, any[]>();
    subscriberIds.forEach((id) => subscriptionsBySubscriber.set(id, []));

    subscriptions.forEach((sub) => {
      const subs = subscriptionsBySubscriber.get(sub.subscriberId);
      if (subs) {
        subs.push(sub.author);
      }
    });

    return subscriberIds.map((id) => subscriptionsBySubscriber.get(id) || []);
  });

  const subscribedToUser = new DataLoader<string, any[]>(async (authorIds) => {
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: [...authorIds] } },
      include: { subscriber: true },
    });

    const subscriptionsByAuthor = new Map<string, any[]>();
    authorIds.forEach((id) => subscriptionsByAuthor.set(id, []));

    subscriptions.forEach((sub) => {
      const subs = subscriptionsByAuthor.get(sub.authorId);
      if (subs) {
        subs.push(sub.subscriber);
      }
    });

    return authorIds.map((id) => subscriptionsByAuthor.get(id) || []);
  });

  return {
    userById,
    postsByAuthorId,
    profileByUserId,
    memberTypeById,
    userSubscribedTo,
    subscribedToUser,
  };
}
