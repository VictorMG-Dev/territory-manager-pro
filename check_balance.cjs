
const fs = require('fs');

function checkBalance(filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    const stack = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '{' || char === '(') {
                stack.push({ char, line: i + 1 });
            } else if (char === '}' || char === ')') {
                if (stack.length === 0) {
                    console.error(`Error: Unexpected '${char}' at line ${i + 1}`);
                    return;
                }
                const last = stack.pop();
                const expected = last.char === '{' ? '}' : ')';
                if (char !== expected) {
                    console.error(`Error: Mismatch at line ${i + 1}. Found '${char}', expected '${expected}' (opened at line ${last.line})`);
                    return;
                }
            }
        }
    }

    if (stack.length > 0) {
        console.error(`Error: Unclosed tags/braces at end of file:`);
        stack.forEach(item => {
            console.error(`  '${item.char}' opened at line ${item.line}`);
        });
    } else {
        console.log("No syntax errors found.");
    }
}

checkBalance('pages/Profile.tsx');
