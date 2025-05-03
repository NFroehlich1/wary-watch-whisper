
# PowerShell script to clone a GitHub repository without preserving commit history
# Usage: .\clone-without-history.ps1 [GitHub URL] [destination folder]

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$RepoUrl,
    
    [Parameter(Mandatory=$false, Position=1)]
    [string]$DestDir = ""
)

# If destination directory is not specified, use the repo name
if ($DestDir -eq "") {
    $DestDir = [System.IO.Path]::GetFileNameWithoutExtension($RepoUrl)
}

# Create temporary directory
$TempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $TempDir | Out-Null

Write-Host "🔄 Cloning repository temporarily..."
git clone $RepoUrl $TempDir

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to clone repository. Please check the URL and your internet connection."
    Remove-Item -Recurse -Force $TempDir
    exit 1
}

Write-Host "🗑️ Removing git history..."
Remove-Item -Recurse -Force "$TempDir\.git"

Write-Host "📁 Creating new destination directory: $DestDir"
New-Item -ItemType Directory -Path $DestDir -Force | Out-Null

Write-Host "📋 Copying files without git history..."
Copy-Item -Recurse -Force "$TempDir\*" -Destination $DestDir
# Copy hidden files (if any)
Get-ChildItem -Path $TempDir -Hidden | ForEach-Object {
    Copy-Item -Recurse -Force $_.FullName -Destination $DestDir
}

# Clean up
Remove-Item -Recurse -Force $TempDir

Write-Host "✨ Creating fresh git repository..."
Set-Location $DestDir
git init
git add .
git commit -m "Initial commit"

Write-Host "✅ Done! Repository has been cloned to $DestDir without previous commit history."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create a new empty repository on GitHub"
Write-Host "2. Run the following commands:"
Write-Host "   cd $DestDir"
Write-Host "   git remote add origin https://github.com/yourusername/new-repo.git"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "This will push your repository with only one initial commit."
