export function load({ locals: { session } }) {
  if (typeof session === 'undefined') return;
  return { user: session.user };
}
