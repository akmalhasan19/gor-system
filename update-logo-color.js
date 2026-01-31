const fs = require('fs');
const path = require('path');

const svgPath = path.join(process.cwd(), 'public/smash-logo.svg');
const iconPath = path.join(process.cwd(), 'src/app/icon.svg');

try {
    let content = fs.readFileSync(svgPath, 'utf8');

    // Replace all hex colors with #000000
    // Matches fill="#xxxxxx" case insensitive
    const blackContent = content.replace(/fill="#[0-9a-fA-F]{6}"/g, 'fill="#000000"');

    // Write back to public
    fs.writeFileSync(svgPath, blackContent);
    console.log('Updated public/smash-logo.svg to black.');

    // Write to src/app/icon.svg
    fs.writeFileSync(iconPath, blackContent);
    console.log('Updated src/app/icon.svg to black.');

} catch (err) {
    console.error('Error processing SVG:', err);
}
