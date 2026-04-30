# How to Commit Changes to GitHub

## Quick Steps

```bash
# 1. Stage specific files
git add <file1> <file2>

# Or stage all changes
git add .

# 2. Commit with a message
git commit -m "your commit message"

# 3. Push to GitHub
git push origin main
```

## Full Example

```bash
git add app/drivers/page.tsx components/ui/footer.tsx
git commit -m "v0.2"
git push origin main
```

## Common Commands

| Command | Description |
|---|---|
| `git status` | See which files have changes |
| `git diff` | See what changed in each file |
| `git add .` | Stage all modified/new files |
| `git add <file>` | Stage a specific file |
| `git commit -m "message"` | Commit staged changes with a message |
| `git push origin main` | Push commits to the `main` branch on GitHub |
| `git log --oneline` | View recent commit history |

## Notes

- Replace `main` with your branch name if different (e.g., `master`, `dev`)
- Always run `git status` first to confirm what will be committed
- Use descriptive commit messages for clarity in git history
