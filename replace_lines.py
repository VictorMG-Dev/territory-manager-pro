
def replace_chunk(target_file, replacement_file, start_line, end_line):
    # Read replacement content
    with open(replacement_file, 'r', encoding='utf-8') as f:
        new_content = f.readlines()
    
    # Read target file
    with open(target_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Keep lines before start_line
    # start_line is 1-indexed, so we slice up to start_line-1
    before = lines[:start_line-1]
    
    # Keep lines after end_line
    # end_line is 1-indexed, so we slice from end_line
    after = lines[end_line:]
    
    # Combine
    final_lines = before + new_content + after
    
    # Write back
    with open(target_file, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    
    print(f"Successfully replaced lines {start_line}-{end_line} in {target_file}")

replace_chunk('pages/Profile.tsx', 'replacement_list.tsx', 1001, 1028)
