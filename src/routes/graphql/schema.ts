import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLEnumType,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

const MemberTypeIdEnum = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  },
});

const MemberTypeType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

let UserType: GraphQLObjectType;
let PostType: GraphQLObjectType;
let ProfileType: GraphQLObjectType;

UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    posts: {
      type: new GraphQLList(PostType),
      resolve: (parent, _args, context: GraphQLContext) => {
        return context.loaders.postsByAuthorId.load(parent.id);
      },
    },
    profile: {
      type: ProfileType,
      resolve: (parent, _args, context: GraphQLContext) => {
        return context.loaders.profileByUserId.load(parent.id);
      },
    },
    subscribedToUser: {
      type: new GraphQLList(UserType),
      resolve: async (parent, _args, context: GraphQLContext) => {
        return context.loaders.subscribedToUser.load(parent.id);
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(UserType),
      resolve: async (parent, _args, context: GraphQLContext) => {
        return context.loaders.userSubscribedTo.load(parent.id);
      },
    },
  }),
});

PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
    author: {
      type: UserType,
      resolve: (parent, _args, context: GraphQLContext) => {
        return context.loaders.userById.load(parent.authorId);
      },
    },
  }),
});

ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(UUIDType) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    user: {
      type: UserType,
      resolve: (parent, _args, context: GraphQLContext) => {
        return context.loaders.userById.load(parent.userId);
      },
    },
    memberType: {
      type: MemberTypeType,
      resolve: (parent, _args, context: GraphQLContext) => {
        return context.loaders.memberTypeById.load(parent.memberTypeId);
      },
    },
  }),
});

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  },
});

const CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  },
});

const ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  },
});

const CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    userId: { type: new GraphQLNonNull(UUIDType) },
  },
});

const ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeIdEnum },
    userId: { type: UUIDType },
  },
});

export interface GraphQLContext {
  prisma: PrismaClient;
  loaders: {
    userById: DataLoader<string, any>;
    postsByAuthorId: DataLoader<string, any[]>;
    profileByUserId: DataLoader<string, any>;
    memberTypeById: DataLoader<string, any>;
    subscribedToUser: DataLoader<string, any[]>;
    userSubscribedTo: DataLoader<string, any[]>;
  };
}

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: (_parent, _args, context: GraphQLContext) => {
        return context.prisma.user.findMany();
      },
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.user.findUnique({
          where: { id: args.id },
        });
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: (_parent, _args, context: GraphQLContext) => {
        return context.prisma.post.findMany();
      },
    },
    post: {
      type: PostType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.post.findUnique({
          where: { id: args.id },
        });
      },
    },
    profiles: {
      type: new GraphQLList(ProfileType),
      resolve: (_parent, _args, context: GraphQLContext) => {
        return context.prisma.profile.findMany();
      },
    },
    profile: {
      type: ProfileType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.profile.findUnique({
          where: { id: args.id },
        });
      },
    },
    memberTypes: {
      type: new GraphQLList(MemberTypeType),
      resolve: (_parent, _args, context: GraphQLContext) => {
        return context.prisma.memberType.findMany();
      },
    },
    memberType: {
      type: MemberTypeType,
      args: { id: { type: new GraphQLNonNull(MemberTypeIdEnum) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.memberType.findUnique({
          where: { id: args.id },
        });
      },
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserType,
      args: { dto: { type: new GraphQLNonNull(CreateUserInput) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.user.create({
          data: args.dto,
        });
      },
    },
    changeUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInput) },
      },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.user.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    deleteUser: {
      type: GraphQLBoolean,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_parent, args, context: GraphQLContext) => {
        await context.prisma.user.delete({
          where: { id: args.id },
        });
        return true;
      },
    },
    createPost: {
      type: PostType,
      args: { dto: { type: new GraphQLNonNull(CreatePostInput) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.post.create({
          data: args.dto,
        });
      },
    },
    changePost: {
      type: PostType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInput) },
      },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.post.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    deletePost: {
      type: GraphQLBoolean,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_parent, args, context: GraphQLContext) => {
        await context.prisma.post.delete({
          where: { id: args.id },
        });
        return true;
      },
    },
    createProfile: {
      type: ProfileType,
      args: { dto: { type: new GraphQLNonNull(CreateProfileInput) } },
      resolve: (_parent, args, context: GraphQLContext) => {
        return context.prisma.profile.create({
          data: args.dto,
        });
      },
    },
    changeProfile: {
      type: ProfileType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInput) },
      },
      resolve: async (_parent, args, context: GraphQLContext) => {
        if (args.dto.userId) {
          throw new Error('Cannot change userId of a profile');
        }
        return context.prisma.profile.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    deleteProfile: {
      type: GraphQLBoolean,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_parent, args, context: GraphQLContext) => {
        await context.prisma.profile.delete({
          where: { id: args.id },
        });
        return true;
      },
    },
    subscribeTo: {
      type: GraphQLBoolean,
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, args, context: GraphQLContext) => {
        await context.prisma.subscribersOnAuthors.create({
          data: {
            subscriberId: args.userId,
            authorId: args.authorId,
          },
        });
        return true;
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
