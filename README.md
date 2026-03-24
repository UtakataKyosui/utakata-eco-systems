# Starlight Starter Kit: Basics

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

```bash
npm create astro@latest -- --template starlight
```

<!-- ASTRO:REMOVE:START -->

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/starlight/tree/main/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/starlight/tree/main/examples/basics)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/withastro/starlight&create_from_path=examples/basics)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwithastro%2Fstarlight%2Ftree%2Fmain%2Fexamples%2Fbasics&project-name=my-starlight-docs&repository-name=my-starlight-docs)

<!-- ASTRO:REMOVE:END -->

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro + Starlight project, you'll see the following folders and files:

```text
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).

## CI/CD

GitHub Actions workflows are included for build verification and Cloudflare Workers deployment.

- `CI`: runs `pnpm install --frozen-lockfile`, `pnpm run lint` (`Biome + markdownlint`), and `pnpm run build` on pull requests and pushes to `main`
- `Deploy`: runs only after the `CI` workflow succeeds on `main` and deploys with `wrangler deploy`
- `Sync Reference Docs`: runs on a daily schedule and on manual dispatch, fetches repositories owned by `ECOSYSTEM_OWNER` with the topic `utakata-eco-system`, copies each README into `src/content/docs/reference/*.md`, and commits any generated changes back to `main`

Set the following GitHub repository secrets before enabling deployment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Set the following repository secret or variable before enabling reference sync:

- `ECOSYSTEM_SYNC_TOKEN`: recommended for this workflow. It allows the sync job to enumerate repositories you own and read their metadata and README contents. Without it, the script can only fall back to public repositories for the configured owner.
- `ECOSYSTEM_OWNER`: optional repository variable to override the GitHub owner to inspect. Defaults to the current repository owner.
- `ECOSYSTEM_TOPIC`: optional repository variable to override the topic filter. Defaults to `utakata-eco-system`.

You can also run the sync locally with:

```bash
pnpm run sync:reference-docs
```

The sync implementation lives in TypeScript and is validated by `pnpm run typecheck` in CI and in the sync workflow itself.
