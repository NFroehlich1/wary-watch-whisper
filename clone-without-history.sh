
#!/bin/bash

# Script to clone a GitHub repository without preserving commit history
# Usage: ./clone-without-history.sh [GitHub URL] [destination folder]

# Check if arguments are provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <github-repo-url> [destination-folder]"
  echo "Example: $0 https://github.com/username/repo.git my-new-repo"
  exit 1
fi

# Setup variables
REPO_URL=$1
TEMP_DIR=$(mktemp -d)
DEST_DIR=${2:-$(basename $REPO_URL .git)}

echo "🔄 Cloning repository temporarily..."
git clone $REPO_URL $TEMP_DIR

if [ $? -ne 0 ]; then
  echo "❌ Failed to clone repository. Please check the URL and your internet connection."
  rm -rf $TEMP_DIR
  exit 1
fi

echo "🗑️ Removing git history..."
rm -rf $TEMP_DIR/.git

echo "📁 Creating new destination directory: $DEST_DIR"
mkdir -p $DEST_DIR

echo "📋 Copying files without git history..."
cp -r $TEMP_DIR/* $DEST_DIR/
cp -r $TEMP_DIR/.* $DEST_DIR/ 2>/dev/null || :

# Clean up
rm -rf $TEMP_DIR

echo "✨ Creating fresh git repository..."
cd $DEST_DIR
git init
git add .
git commit -m "Initial commit"

echo "✅ Done! Repository has been cloned to $DEST_DIR without previous commit history."
echo ""
echo "Next steps:"
echo "1. Create a new empty repository on GitHub"
echo "2. Run the following commands:"
echo "   cd $DEST_DIR"
echo "   git remote add origin https://github.com/yourusername/new-repo.git"
echo "   git push -u origin main"
echo ""
echo "This will push your repository with only one initial commit."

chmod +x "$0"
