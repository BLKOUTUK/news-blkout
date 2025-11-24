#!/usr/bin/env python3
"""
Create a zip archive of the fixed BLKOUT extension
"""
import os
import zipfile
import sys

def create_extension_zip(source_dir, output_zip):
    """Create a zip file from the source directory"""
    if not os.path.exists(source_dir):
        print(f"❌ Error: Source directory not found: {source_dir}")
        return False

    try:
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Walk through the directory
            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    # Skip backup files
                    if file.endswith('.backup'):
                        continue

                    file_path = os.path.join(root, file)
                    # Create archive name relative to source_dir
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)

        print(f"✓ Successfully created: {output_zip}")

        # Verify the zip
        with zipfile.ZipFile(output_zip, 'r') as zipf:
            file_count = len(zipf.namelist())
            print(f"✓ Archive contains {file_count} files")

        return True

    except Exception as e:
        print(f"❌ Error creating zip: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: create-extension-zip.py <source_dir> <output_zip>")
        sys.exit(1)

    source_dir = sys.argv[1]
    output_zip = sys.argv[2]

    success = create_extension_zip(source_dir, output_zip)
    sys.exit(0 if success else 1)
