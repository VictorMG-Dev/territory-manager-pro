
import re

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    
    # regex for interesting tokens
    # We want to track: { } ( ) <div </div>
    # Simplification: just track braces and parens for now, as that's often where it breaks.
    # Also track <div> specifically if possible, but JSX tags are harder with attributes.
    
    # Let's try to track indentation or just braces/parens balance.
    
    for i, line in enumerate(lines):
        line_num = i + 1
        for char in line:
            if char in '{(':
                stack.append((char, line_num))
            elif char in '})':
                if not stack:
                    print(f"Error: Unexpected '{char}' at line {line_num}")
                    return
                
                last_char, last_line = stack.pop()
                expected = '}' if last_char == '{' else ')'
                if char != expected:
                    print(f"Error: Mismatch at line {line_num}. Found '{char}', expected '{expected}' (opened at line {last_line})")
                    return

    if stack:
        print(f"Error: Unclosed tags/braces at end of file:")
        for char, line in stack:
            print(f"  '{char}' opened at line {line}")

check_balance('pages/Profile.tsx')
