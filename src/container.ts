import { DatabaseProvider } from "./providers/database";
import { RedisProvider } from "./providers/redis";
import { CacheService } from "./utils/cache";
import { CryptoService } from "./utils/crypto";
import { SessionCacheService } from "./utils/sessionCache";
import { LoginRateLimitService } from "./utils/loginRateLimit";
import { CacheInvalidationService } from "./utils/cacheInvalidation";
import { UserRepository } from "./Repository/User.repository";
import { SessionRepository } from "./Repository/Session.repository";
import { PostRepository } from "./Repository/Post.repository";
import { CommentRepository } from "./Repository/Comment.repository";
import { AuthService } from "./Modules/Auth/auth.service";
import { AuthController } from "./Modules/Auth/auth.controller";
import { UsersService } from "./Modules/Users/users.service";
import { UsersController } from "./Modules/Users/users.controller";
import { PostsService } from "./Modules/Posts/posts.service";
import { PostsController } from "./Modules/Posts/posts.controller";
import { CommentsService } from "./Modules/Comments/comments.service";
import { CommentsController } from "./Modules/Comments/comments.controller";
import { StatsService } from "./Modules/Stats/stats.service";
import { StatsController } from "./Modules/Stats/stats.controller";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { ValidateMiddleware } from "./middlewares/validate";
import { ErrorMiddleware } from "./middlewares/errorHandler";

export class Container {
  readonly databaseProvider: DatabaseProvider;
  readonly redisProvider: RedisProvider;

  readonly cacheService: CacheService;
  readonly cryptoService: CryptoService;
  readonly sessionCacheService: SessionCacheService;
  readonly loginRateLimitService: LoginRateLimitService;
  readonly cacheInvalidationService: CacheInvalidationService;

  readonly userRepository: UserRepository;
  readonly sessionRepository: SessionRepository;
  readonly postRepository: PostRepository;
  readonly commentRepository: CommentRepository;

  readonly authService: AuthService;
  readonly usersService: UsersService;
  readonly postsService: PostsService;
  readonly commentsService: CommentsService;
  readonly statsService: StatsService;

  readonly authController: AuthController;
  readonly usersController: UsersController;
  readonly postsController: PostsController;
  readonly commentsController: CommentsController;
  readonly statsController: StatsController;

  readonly authMiddleware: AuthMiddleware;
  readonly validateMiddleware: ValidateMiddleware;
  readonly errorMiddleware: ErrorMiddleware;

  constructor() {
    this.databaseProvider = new DatabaseProvider();
    this.redisProvider = new RedisProvider();

    this.cacheService = new CacheService(this.redisProvider);
    this.cryptoService = new CryptoService();
    this.sessionCacheService = new SessionCacheService(this.cacheService);
    this.loginRateLimitService = new LoginRateLimitService(this.cacheService);
    this.cacheInvalidationService = new CacheInvalidationService(
      this.cacheService
    );

    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
    this.postRepository = new PostRepository();
    this.commentRepository = new CommentRepository();

    this.authService = new AuthService(
      this.userRepository,
      this.sessionRepository,
      this.cryptoService,
      this.loginRateLimitService,
      this.sessionCacheService
    );
    this.usersService = new UsersService(
      this.userRepository,
      this.postRepository,
      this.commentRepository,
      this.cacheService,
      this.cacheInvalidationService
    );
    this.postsService = new PostsService(
      this.postRepository,
      this.commentRepository,
      this.cacheService,
      this.cacheInvalidationService
    );
    this.commentsService = new CommentsService(
      this.commentRepository,
      this.postRepository,
      this.cacheService,
      this.cacheInvalidationService
    );
    this.statsService = new StatsService(
      this.postRepository,
      this.cacheService
    );

    this.authController = new AuthController(this.authService);
    this.usersController = new UsersController(this.usersService);
    this.postsController = new PostsController(this.postsService);
    this.commentsController = new CommentsController(this.commentsService);
    this.statsController = new StatsController(this.statsService);

    this.authMiddleware = new AuthMiddleware(
      this.sessionRepository,
      this.userRepository,
      this.sessionCacheService
    );
    this.validateMiddleware = new ValidateMiddleware();
    this.errorMiddleware = new ErrorMiddleware();
  }
}

export function createContainer(): Container {
  return new Container();
}
