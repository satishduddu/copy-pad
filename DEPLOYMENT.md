Hosting & Deployment

1) Initialize git and push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# create repo using GitHub web UI or gh CLI
# example with GitHub CLI:
# gh repo create <your-username>/<repo-name> --public --source=. --remote=origin --push
git push -u origin main
```

2) Connect to Vercel (recommended)

- Import the GitHub repository into Vercel for automatic deployments on push.
- Set environment variables in the Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

3) Optional: Use GitHub Action deploy

- The workflow `.github/workflows/vercel-deploy.yml` deploys to Vercel on push to `main`.
- Add repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

4) Manual Vercel CLI deploy

```bash
npm i -g vercel
vercel
vercel --prod
```

5) Build output

- Production build uses `npm run build` and outputs to `dist` which Vercel serves. The included `vercel.json` configures the static build and SPA routing.

If you want, I can create the GitHub repo and push the initial commit for you (requires GitHub access) or run the push commands locally — tell me which you prefer.
