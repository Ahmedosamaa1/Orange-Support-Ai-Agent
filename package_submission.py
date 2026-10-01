import os
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_ZIP = BASE_DIR / "Orange_Smart_Support_Submission.zip"

# Folders and files to exclude from final submission
EXCLUDE_DIRS = {
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".git",
    ".vite",
    "dist"
}

EXCLUDE_FILES = {
    ".env",
    "Orange_Smart_Support_Submission.zip"
}

def create_zip():
    print(f"📦 Packaging submission zip: {OUTPUT_ZIP.name}...")
    file_count = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(BASE_DIR):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

            for file in files:
                if file in EXCLUDE_FILES or file.endswith(".pyc"):
                    continue

                abs_path = Path(root) / file
                rel_path = abs_path.relative_to(BASE_DIR)

                # Skip root .env or backend/.env
                if rel_path.name == ".env":
                    continue

                zipf.write(abs_path, arcname=str(rel_path))
                file_count += 1

    zip_size_mb = round(OUTPUT_ZIP.stat().st_size / (1024 * 1024), 2)
    print(f"✅ Submission zip created successfully!")
    print(f"📁 Location: {OUTPUT_ZIP}")
    print(f"📄 Total Files: {file_count}")
    print(f"📊 Size: {zip_size_mb} MB")
    print(f"🔒 Security Check: 'backend/.env' successfully EXCLUDED (Clean .env.example included).")

if __name__ == "__main__":
    create_zip()
