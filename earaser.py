import os
import re
import json

# --- CONFIGURATION ---
TARGET_EXTENSIONS = ('.ts', '.tsx', '.js', '.jsx', '.py', '.md')
LORE_PREFIXES = ["// [", "// ARCHITECT", "// VOID_WEAVER", "// SYS", "// PROTOCOL"]

# Polite AI -> Brutalist Architect Mapping
ERROR_MAP = {
    "UPLINK_FAILURE": "UPLINK_FAILURE",
    "NULL_DOM_NODE": "NULL_DOM_NODE",
    "CIRCUIT_BREACH": "CIRCUIT_BREACH",
    "VALIDATION_ERROR: INVALID_CONFIG": "VALIDATION_ERROR: INVALID_CONFIG",
    "SIGNAL_LOST": "SIGNAL_LOST",
    "SYSTEM_ONLINE": "SYSTEM_ONLINE"
}

def scrub_content(file_path, content):
    filename = os.path.basename(file_path)
    
    # 1. Vaporize AI Studio Metadata (README specific)
    if filename.lower() == "readme.md":
        content = re.sub(r'View your app in AI Studio:.*', '', content)
        content = re.sub(r'Built with.*AI.*', 'ENGINEERED_BY_VOID_WEAVER', content)

    # 2. Vaporize JSDoc blocks (The biggest giveaway)
    content = re.sub(r'/\*\*[\s\S]*?\*/', '', content)

    # 3. Vaporize Single-Line Boilerplate
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        # Keep the line if it's code or a Lore Comment
        if "//" in line:
            comment_part = line.split("//")[1].strip().lower()
            # If it's a generic "This function handles X" comment, kill it
            if any(word in comment_part for word in ["this function", "handles", "returns", "imports", "defines"]):
                if not any(prefix in line for prefix in LORE_PREFIXES):
                    line = line.split("//")[0].rstrip()
        
        # 4. Brutalize Error Messages
        for polite, brutal in ERROR_MAP.items():
            if polite in line:
                line = line.replace(polite, brutal)
                
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def execute_scrub(root_dir):
    print(f"\033[1;31m--> [INITIATING_SCRUB]: {root_dir}\033[0m")
    
    for subdir, dirs, files in os.walk(root_dir):
        # Skip node_modules and .git
        if 'node_modules' in subdir or '.git' in subdir:
            continue
            
        for file in files:
            if file.endswith(TARGET_EXTENSIONS):
                file_path = os.path.join(subdir, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        original = f.read()
                    
                    cleaned = scrub_content(file_path, original)
                    
                    if original != cleaned:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(cleaned)
                        print(f"\033[1;35m[PURGED]:\033[0m {file}")
                except Exception as e:
                    print(f"\033[1;31m[FAILURE]:\033[0m {file} - {str(e)}")

if __name__ == "__main__":
    # Target the current directory
    target = os.getcwd()
    execute_scrub(target)
    print("\033[1;32m--> [SCRUB_COMPLETE]: TURING_SIGNATURES_EXPUNGED.\033[0m")