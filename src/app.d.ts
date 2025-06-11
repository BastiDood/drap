declare namespace App {
  interface Locals {
    db: import('$lib/server/database').Database;
    session?: {
      id: import('$lib/server/database').schema.Session['id'];
      user?: import('$lib/server/database').schema.User;
    };
  }
}
