declare namespace App {
  interface Locals {
    db: import('$lib/server/database').Database;
    dispatch: import('$lib/server/email/dispatch').NotificationDispatcher;
    session?: {
      id: import('$lib/server/database').schema.Session['id'];
      user?: import('$lib/server/database').schema.User;
    };
  }
}
