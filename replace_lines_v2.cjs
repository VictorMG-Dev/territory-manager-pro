
const fs = require('fs');

const targetFile = 'pages/Profile.tsx';
const replacementFile = 'replacement_list.tsx';
const startLine = 1001; // 1-indexed
const endLine = 1028;   // 1-indexed

try {
    const replacementContent = fs.readFileSync(replacementFile, 'utf-8').split(/\r?\n/);
    const targetContent = fs.readFileSync(targetFile, 'utf-8').split(/\r?\n/);

    console.log(`Original line count: ${targetContent.length}`);
    console.log(`Replacing lines ${startLine} to ${endLine}`);
    console.log(`Line ${startLine} (to be replaced):`, targetContent[startLine - 1]);
    console.log(`Line ${endLine} (to be replaced):`, targetContent[endLine - 1]);

    // 0-indexed: keep 0 to startLine-2
    // If startLine is 1001, we want to keep indices 0..999 (lines 1..1000)
    // slice(0, 1000) returns 0..999
    const before = targetContent.slice(0, startLine - 1);

    // 0-indexed: keep endLine to end
    // If endLine is 1028, we want to start keeping from index 1028 (line 1029)
    // slice(1028) returns 1028..end
    const after = targetContent.slice(endLine);

    const newContent = [...before, ...replacementContent, ...after].join('\n');

    fs.writeFileSync(targetFile, newContent, 'utf-8');
    console.log(`New line count: ${newContent.split('\n').length}`);
    console.log('Success.');
} catch (error) {
    console.error('Error:', error);
}
