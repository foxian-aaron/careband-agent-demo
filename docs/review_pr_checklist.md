# Review PR Checklist

The branch URL is not the same as a real pull request URL.

Branch URL:

```text
https://github.com/foxian-aaron/careband-agent-demo/tree/careband-v0.2-apple-health
```

Real PR URL format:

```text
https://github.com/foxian-aaron/careband-agent-demo/pull/<number>
```

## Create The PR In GitHub UI

1. Open the repository.
2. Click "Compare & pull request" for `careband-v0.2-apple-health`.
3. Base branch: `main`.
4. Head branch: `careband-v0.2-apple-health`.
5. Title:

```text
feat: CareBand Agent v0.2 Apple Health pipeline
```

6. Paste the contents of `docs/pr_description.md`.
7. Create a draft PR if the demo still needs manual browser QA.

## Optional GitHub CLI Command

Only run this if `gh` is installed and authenticated:

```bash
gh pr create \
  --base main \
  --head careband-v0.2-apple-health \
  --title "feat: CareBand Agent v0.2 Apple Health pipeline" \
  --body-file docs/pr_description.md
```

## PR Description Sections

The PR body should include:

- Summary
- What changed
- How to run
- How to test
- Demo flow
- Privacy notes
- Remaining risks

