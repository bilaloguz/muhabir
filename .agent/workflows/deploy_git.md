
# Workflow: Deployment and Git Push

This workflow describes how to initialize, commit, and push changes to the remote repository.

// turbo-all
1. Initialize git if not already present
2. Add remote origin
3. Add all files
4. Commit with a message
5. Push to main branch

```bash
git init
git remote add origin https://github.com/bilaloguz/muhabir.git || git remote set-url origin https://github.com/bilaloguz/muhabir.git
git add .
git commit -m "feat: Enhanced UI with Glassmorphism, Search, and Advanced Filtering"
git branch -M main
git push -u origin main
```
