
# Cloning the Repository Without History

This guide explains how to create a fresh clone of this repository without preserving the commit history.

## Why Clone Without History?

There are several scenarios where you might want to clone a repository without its history:

- Creating a new project based on an existing codebase
- Sharing code without exposing internal development history
- Reducing repository size when the history isn't needed
- Starting fresh with your own commit history

## Option 1: Using the Provided Scripts

This repository includes two scripts to make this process easy:

- `clone-without-history.sh` for macOS/Linux users
- `clone-without-history.ps1` for Windows users

### On macOS/Linux:

```bash
# Make the script executable
chmod +x clone-without-history.sh

# Clone without history
./clone-without-history.sh https://github.com/username/repository.git new-folder
```

### On Windows:

```powershell
# Run the PowerShell script
.\clone-without-history.ps1 https://github.com/username/repository.git new-folder
```

## Option 2: Manual Method

If you prefer to do this manually:

1. Create a new empty directory for your project
   ```bash
   mkdir new-project
   cd new-project
   ```

2. Initialize a new Git repository
   ```bash
   git init
   ```

3. Add the original repository as a remote and fetch it
   ```bash
   git remote add origin https://github.com/username/original-repo.git
   git fetch
   ```

4. Create a new branch based on the current state of the original repository
   ```bash
   git checkout -b temp origin/main
   ```

5. Create a new orphan branch (with no history)
   ```bash
   git checkout --orphan fresh-start
   ```

6. Add all the files
   ```bash
   git add .
   ```

7. Commit the files
   ```bash
   git commit -m "Initial commit"
   ```

8. Delete the temporary branch
   ```bash
   git branch -D temp
   ```

9. Rename the current branch to 'main'
   ```bash
   git branch -m main
   ```

10. Optional: Add your new remote repository
    ```bash
    git remote remove origin
    git remote add origin https://github.com/yourusername/new-repo.git
    git push -u origin main
    ```

## Next Steps

After cloning without history, you can:

1. Create a new repository on GitHub, GitLab, or your preferred platform
2. Add the new empty repository as a remote
3. Push your code to establish a new history

The repository is now ready for use with only a single initial commit in its history.
