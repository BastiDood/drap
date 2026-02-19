declare namespace App {
  interface Locals {
    session?: {
      id: import('$lib/server/database/schema/auth').Session['id'];
      user?: import('$lib/server/database/schema/app').User;
    };
  }
}
