Security notes — do NOT commit secrets

This repository may reference environment variables and service credentials. Follow these rules to avoid leaking secrets in commits or remote repositories.

1) Never commit secret files
- Local secret files: `.env.local`, `.env`, `firebase.client.json`, service account JSON files, private keys, etc. These are listed in `.gitignore` and should remain untracked.

2) Use example files
- Copy `.env.example` (this file) to `.env.local` and populate values locally.
- Keep any example files free of real secrets.

3) Use platform secret storage for CI / deployed environments
- GitHub Actions: use repository or organization Secrets (Settings → Secrets) and reference them in workflows.
- Cloudflare Workers: use `wrangler secret put NAME` to store secrets instead of committing `wrangler.toml`/`wrangler.jsonc` values.
- Firebase Functions: use `firebase functions:config:set openai.key="..."` (or use a secret manager) — avoid committing keys into functions source.

4) If you accidentally committed a secret
- Remove the file from the repo and commit the removal:

```bash
git rm --cached path/to/secret-file
git commit -m "remove secret file"
git push
```

- Then rotate the compromised credentials immediately (OpenAI key, Firebase credentials, service account keys).
- To purge from history (if the secret was pushed), use one of these tools:
  - BFG (easy): https://rtyley.github.io/bfg-repo-cleaner/
  - git filter-repo (recommended): https://github.com/newren/git-filter-repo

Example (BFG):
```bash
# install bfg, then:
java -jar bfg.jar --delete-files .env.local
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

Example (git filter-repo):
```bash
git filter-repo --path .env.local --invert-paths
git push --force
```

5) Helpful checks before commit
- Run a quick grep for common secret patterns:

```bash
# search for OpenAI-like keys
git grep -n "sk-" || true
# search for private key headers
git grep -n "-----BEGIN PRIVATE KEY-----" || true
```

6) Rotating keys
- If a key was ever pushed to a remote you don't control or shared, assume it is compromised and rotate it:
  - OpenAI: https://platform.openai.com/account/api-keys
  - Firebase: rotate service-account keys in Google Cloud Console and update config
  - Cloudflare: rotate worker secrets and API tokens

If you'd like, I can:
- Create a small pre-commit script that checks for common patterns and prevents commits.
- Help you purge any accidentally committed secret and guide rotation.
- Add repository guidance to your README or CI workflows.

If you want me to run a deeper scan (search for common secret patterns across tracked history), tell me and I will run a read-only scan and report exact file paths (without printing secret values).