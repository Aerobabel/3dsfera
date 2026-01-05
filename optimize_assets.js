
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
        // 1. HIGH: Draco Compression ONLY (No Simplification) - Preserves 100% detail
        console.log(`   - Generating High LOD (Draco only)...`);
        execSync(`npx @gltf-transform/cli draco "${inputPath}" "${outHigh}" --method edgebreaker`, { stdio: 'inherit' });

        // 2. MEDIUM: 50% Simplification + Draco
        console.log(`   - Generating Medium LOD (50% simplify)...`);
        execSync(`npx @gltf-transform/cli simplify "${inputPath}" "${outMed}" --ratio 0.5 --error 0.001`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli draco "${outMed}" "${outMed}" --method edgebreaker`, { stdio: 'inherit' });

        // 3. LOW: 10% Simplification + Draco
        console.log(`   - Generating Low LOD (10% simplify)...`);
        execSync(`npx @gltf-transform/cli simplify "${inputPath}" "${outLow}" --ratio 0.1 --error 0.01`, { stdio: 'inherit' });
        execSync(`npx @gltf-transform/cli draco "${outLow}" "${outLow}" --method edgebreaker`, { stdio: 'inherit' });

        console.log(`   ✅ Done.`);
    } catch (error) {
        console.error(`   ❌ Error processing ${filename}:`, error.message);
    }
});

console.log(`\n🎉 Optimization Complete! Assets saved to ${OUTPUT_DIR}`);
