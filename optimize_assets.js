import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOURCE_DIR = './public/objects';
const OUTPUT_DIR = './public/objects/optimized_lods';
const ASSETS_TO_OPTIMIZE = [
    // W&T Engineering Assets
    'valve.glb',
    'valve1.glb',
    'valve2.glb',
    'ball_valve.glb',
    'water_pipe_valve.glb',
    'industrial_table.glb',
    // Heavy Machinery
    'optimized/road_grader.glb', // Already optimized but can be LOD'd further
    'optimized/crane_machine.glb'
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`🚀 Starting LOD Generation Pipeline...`);

ASSETS_TO_OPTIMIZE.forEach(filename => {
    const inputPath = path.join(SOURCE_DIR, filename);
    const basename = path.basename(filename, '.glb');

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
        console.warn(`⚠️ Warning: Source file not found: ${inputPath}`);
        return;
    }

    console.log(`\n📦 Processing: ${filename}`);

    // Output paths
    const outHigh = path.join(OUTPUT_DIR, `${basename}_high.glb`);
    const outMed = path.join(OUTPUT_DIR, `${basename}_med.glb`);
    const outLow = path.join(OUTPUT_DIR, `${basename}_low.glb`);

    try {
        // 1. HIGH: Resize to 1024 + Draco
        console.log(`   - Generating High LOD (Resize 1024 + Draco)...`);
        execSync(`npx @gltf-transform/cli resize "${inputPath}" "${outHigh}" --width 1024 --height 1024`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli draco "${outHigh}" "${outHigh}" --method edgebreaker`, { stdio: 'inherit' });

        // 2. MEDIUM: Resize 512 + 50% Simplify + Draco
        console.log(`   - Generating Medium LOD (Resize 512 + 50% simplify)...`);
        execSync(`npx @gltf-transform/cli resize "${inputPath}" "${outMed}" --width 512 --height 512`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli simplify "${outMed}" "${outMed}" --ratio 0.5 --error 0.001`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli draco "${outMed}" "${outMed}" --method edgebreaker`, { stdio: 'inherit' });

        // 3. LOW: Resize 256 + 10% Simplify + Draco
        console.log(`   - Generating Low LOD (Resize 256 + 10% simplify)...`);
        execSync(`npx @gltf-transform/cli resize "${inputPath}" "${outLow}" --width 256 --height 256`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli simplify "${outLow}" "${outLow}" --ratio 0.1 --error 0.01`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli draco "${outLow}" "${outLow}" --method edgebreaker`, { stdio: 'inherit' });

        console.log(`   ✅ Done.`);
    } catch (error) {
        console.error(`   ❌ Error processing ${filename}:`, error.message);
    }
});

console.log(`\n🎉 Optimization Complete! Assets saved to ${OUTPUT_DIR}`);
