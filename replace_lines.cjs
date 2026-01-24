
const fs = require('fs');

const targetFile = 'pages/Profile.tsx';
const replacementFile = 'replacement_list.tsx';
const startLine = 1001;
const endLine = 1028;

try {
    const replacementContent = fs.readFileSync(replacementFile, 'utf-8').split('\n');
    const targetContent = fs.readFileSync(targetFile, 'utf-8').split('\n');

    // 1-indexed adjustments
    const before = targetContent.slice(0, startLine - 1);
    const after = targetContent.slice(endLine);

    const newContent = [...before, ...replacementContent, ...after].join('\n');

    fs.writeFileSync(targetFile, newContent, 'utf-8');
    console.log(`Successfully replaced lines ${startLine}-${endLine} in ${targetFile}`);
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
