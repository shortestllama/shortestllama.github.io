import sys
import re
from pathlib import Path

def update_published_field(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match YAML front matter
    match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not match:
        print(f"[!] Skipping: {file_path} (no YAML front matter found)")
        return

    front_matter, body = match.groups()
    
    if 'published: false' not in front_matter:
        print(f"[ ] Skipping: {file_path} (already published or no 'published' field)")
        return

    # Replace only the published line
    updated_front_matter = re.sub(r'published:\s*false', 'published: true', front_matter)

    # Write the updated file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(f"---\n{updated_front_matter}\n---\n{body}")
    
    print(f"[✔] Updated: {file_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python publish_writeups.py file1.md file2.md ...")
        sys.exit(1)

    for arg in sys.argv[1:]:
        path = Path(arg)
        if path.is_file() and path.suffix == '.md':
            update_published_field(path)
        else:
            print(f"[!] Invalid file: {arg}")

