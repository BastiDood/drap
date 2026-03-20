export function stripPrefix(text: string, prefix: string) {
  if (text.startsWith(prefix)) return text.slice(prefix.length);
}
