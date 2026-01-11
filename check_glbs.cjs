
const fs = require('fs');
const path = require('path');

const SEARCH_STR = 'KHR_materials_pbrSpecularGlossiness';
const DIR = './public/objects';

function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.glb') || file.endsWith('.gltf')) {
            try {
                const content = fs.readFileSync(fullPath);
                // Simple binary search for string
                if (content.indexOf(SEARCH_STR) !== -1) {
                    console.log(`[FOUND] ${fullPath}`);
                }
            } catch (e) {
                console.error(`Error reading ${fullPath}:`, e.message);
            }
        }
    });
}

console.log(`Scanning for ${SEARCH_STR}...`);
scanDir(DIR);
