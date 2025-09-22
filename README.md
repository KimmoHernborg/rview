## Rview

Simple Reddit image and video viewer.
Uses Reddit's JSON feed as the data source.

- **Tech stack**: Vite, React, TypeScript, TanStack Query
- **Runtime**: Browser-only (static site)

### Quick start

Using Bun (recommended):

```bash
bun install
bun run dev
```

Open the dev server URL printed in your terminal.

### Usage

This app reads from `https://old.reddit.com/<path>.json`. The current feed path is taken from the URL hash.

- Set the hash to a subreddit: `#r/itookapicture`
- Set the hash to a user: `#user/damnmyeye`
- Leave empty to browse the front page: `#` or no hash

Examples:

```text
#r/aww
#r/pics
#user/ExampleUser
```

Navigation:

- Use the on-screen Prev / Next buttons to move between items
- For gallery posts, Next advances within the gallery before moving to the next post
- When moving backward from the next post into a gallery, it opens at the last image

### Features

- Infinite loading of posts (TanStack Query)
- Preloads the next post/media for smooth transitions
- Supports images, hosted videos, rich embeds, and galleries
- Blurred background image behind media
- Disabled Prev/Next buttons when there is no data or no more items

### Scripts

```bash
# Start dev server
bun run dev

# Type-check and build for production
bun run build

# Preview the production build locally
bun run preview

# Lint
bun run lint
```

Build output is written to `dist/`.

### Docker

A multi-stage Dockerfile is provided. It builds with Bun and serves the static site with Caddy.

```bash
docker build -t rview .
docker run --rm -p 8080:80 rview
```

Open `http://localhost:8080`.

### Notes

- The app filters the Reddit feed to media-focused posts: images, hosted videos, rich videos, and galleries.
- Data is cached in-memory by TanStack Query for 24h; window refetch is disabled for a lightweight viewer experience.

### License

MIT
