export const Messages = {
  // Auth
  SIGNUP_SUCCESS: "Account created successfully",
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  LOGOUT_ALL_SUCCESS: "Logged out from all devices",
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_EXISTS: "An account with this email already exists",
  UNAUTHORIZED: "Authentication required",
  INVALID_SESSION: "Invalid or expired session",
  TOO_MANY_LOGIN_ATTEMPTS:
    "Too many login attempts. Try again in 15 minutes",
  tooManyLoginAttempts: (minutes: number) =>
    `Too many login attempts. Try again in ${minutes} minutes`,

  // Users
  PROFILE_UPDATED: "Profile updated successfully",

  // Posts
  POST_CREATED: "Post created successfully",
  POST_UPDATED: "Post updated successfully",
  POST_DELETED: "Post deleted successfully",
  POST_NOT_FOUND: "Post not found",
  POST_NOT_PUBLISHED: "Comments are only allowed on published posts",
  FORBIDDEN_POST: "You are not allowed to modify this post",

  // Comments
  COMMENT_CREATED: "Comment added successfully",
  COMMENT_DELETED: "Comment deleted successfully",
  COMMENT_NOT_FOUND: "Comment not found",
  FORBIDDEN_COMMENT: "You are not allowed to delete this comment",

  // Validation
  INVALID_OBJECT_ID: "Invalid ID format",
  VALIDATION_FAILED: "Validation failed",

  // Generic
  NOT_FOUND: "Resource not found",
  INTERNAL_ERROR: "Internal server error",
} as const;
