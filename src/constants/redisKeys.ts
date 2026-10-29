import { config } from "./config";

const P = () => config.redis.keyPrefix;

export const RedisTTL = {
  PROFILE: 60 * 60,
  POST: 10 * 60,
  POST_LIST: 60,
  STATS: 5 * 60,
  COMMENTS: 60,
  LOGIN_FAIL: 15 * 60,
} as const;

export const RedisKeys = {
  session: (token: string) => `${P()}session:${token}`,
  userSessions: (userId: string) => `${P()}user:${userId}:sessions`,
  user: (userId: string) => `${P()}user:${userId}`,
  loginFail: (email: string) => `${P()}login:fail:${email}`,
  loginFailIp: (ip: string) => `${P()}login:fail:ip:${ip}`,
  post: (id: string) => `${P()}post:${id}`,
  postsListVersion: () => `${P()}posts:list:version`,
  postsList: (params: {
    version: number | string;
    page: number;
    limit: number;
    search: string;
    tag: string;
    sort: string;
  }) =>
    `${P()}posts:list:v${params.version}:p${params.page}:l${params.limit}:s${params.search}:t${params.tag}:o${params.sort}`,
  stats: () => `${P()}stats`,
  commentsVersion: (postId: string) => `${P()}post:${postId}:comments:version`,
  commentsList: (postId: string, version: number | string, page: number, limit: number) =>
    `${P()}post:${postId}:comments:v${version}:p${page}:l${limit}`,
} as const;
