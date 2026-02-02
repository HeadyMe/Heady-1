#!/usr/bin/env node
/**
 * HEADY ICON GENERATOR
 * Creates beautiful sacred geometry icons for desktop shortcuts
 * Uses Golden Ratio, Flower of Life, and gradient designs
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const PHI = 1.618;
const ICON_SIZES = [16, 32, 48, 64, 128, 256, 512];
const OUTPUT_DIR = path.join(__dirname);

// Sacred Geometry Colors
const COLORS = {
    primary: '#6366f1',
    secondary: '#22d3ee',
    tertiary: '#a855f7',
    gold: '#FFD700',
    emerald: '#50C878',
    cyan: '#00CED1',
    rose: '#FF1493'
};

function createGradient(ctx, width, height, colors) {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
    );
    colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color);
    });
    return gradient;
}

function drawFlowerOfLife(ctx, centerX, centerY, radius, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Six surrounding circles
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawGoldenSpiral(ctx, centerX, centerY, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    let angle = 0;
    let radius = 1;
    ctx.moveTo(centerX, centerY);
    
    for (let i = 0; i < 200; i++) {
        angle += 0.1;
        radius *= 1.01;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function createHeadyIcon(size, emoji, name) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = createGradient(ctx, size, size, [
        COLORS.primary,
        COLORS.tertiary,
        COLORS.secondary
    ]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Sacred geometry overlay
    ctx.globalAlpha = 0.15;
    drawFlowerOfLife(ctx, size / 2, size / 2, size / 6, COLORS.gold);
    ctx.globalAlpha = 1;
    
    // Emoji/Icon
    if (emoji) {
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
    }
    
    // Border glow
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = size / 64;
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = size / 32;
    ctx.strokeRect(0, 0, size, size);
    
    return canvas;
}

function createHealthDashboardIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = createGradient(ctx, size, size, [
        COLORS.emerald,
        COLORS.cyan,
        COLORS.primary
    ]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Sacred geometry
    ctx.globalAlpha = 0.2;
    drawFlowerOfLife(ctx, size / 2, size / 2, size / 5, 'white');
    ctx.globalAlpha = 1;
    
    // Heart icon
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💚', size / 2, size / 2 + size * 0.05);
    
    return canvas;
}

function createMCPIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = createGradient(ctx, size, size, [
        COLORS.tertiary,
        COLORS.rose,
        COLORS.primary
    ]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Sacred geometry
    ctx.globalAlpha = 0.2;
    drawGoldenSpiral(ctx, size / 2, size / 2, size / 3, 'white');
    ctx.globalAlpha = 1;
    
    // Icon
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎼', size / 2, size / 2 + size * 0.05);
    
    return canvas;
}

function savePNG(canvas, filename) {
    const buffer = canvas.toBuffer('image/png');
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Created: ${filename}`);
}

function generateAllIcons() {
    console.log('🎨 Generating Heady Desktop Icons with Sacred Geometry...\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Main Heady Icon
    ICON_SIZES.forEach(size => {
        const canvas = createHeadyIcon(size, '∞', 'heady');
        savePNG(canvas, `heady-${size}.png`);
    });
    
    // Health Dashboard Icon
    ICON_SIZES.forEach(size => {
        const canvas = createHealthDashboardIcon(size);
        savePNG(canvas, `health-${size}.png`);
    });
    
    // MCP Icon
    ICON_SIZES.forEach(size => {
        const canvas = createMCPIcon(size);
        savePNG(canvas, `mcp-${size}.png`);
    });
    
    // Docker Icon
    ICON_SIZES.forEach(size => {
        const canvas = createHeadyIcon(size, '🐳', 'docker');
        savePNG(canvas, `docker-${size}.png`);
    });
    
    console.log('\n✨ All icons generated successfully!');
    console.log(`📁 Location: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
    try {
        generateAllIcons();
    } catch (error) {
        console.error('❌ Error generating icons:', error.message);
        console.log('\n💡 Note: This requires the "canvas" package.');
        console.log('   Install with: npm install canvas');
        process.exit(1);
    }
}

module.exports = { generateAllIcons, createHeadyIcon };
