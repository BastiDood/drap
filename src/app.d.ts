declare namespace App {
  interface Locals {
    session?: {
      id: import('$lib/server/database').schema.Session['id'];
      user?: import('$lib/server/database').schema.User;
    };
  }
}
