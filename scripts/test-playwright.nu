def open-if-present [file: string] {
  try { open $file } catch { null }
}

def --env load-dotenv [file: string] {
  let raw = (open-if-present $file)
  if $raw == null {
    return
  }
  $raw | from toml | load-env
}

def main [environment?: string] {
  do {
    load-dotenv .env
    if $environment != null {
      load-dotenv $".env.($environment)"
      load-dotenv $".env.($environment).local"
    }
    pnpm test:playwright
  }
}
