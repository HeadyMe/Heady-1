#!/bin/bash
# -----------------------------------------------------------------------------
# FILE: setup_golden_master.sh
# DESCRIPTION: Generates the entire Heady AI-Native Infrastructure.
#              1. Creates Codex, Goose, Yandex, Vinci, and Orion.
#              2. Cleans up legacy files into the Vector Archive.
#              3. Syncs the Golden Master state to all 3 Heady repositories.
# -----------------------------------------------------------------------------

echo "Initializing Heady Golden Master Protocol..."

# 1. Create Directory Structure
mkdir -p modules
mkdir -p admin/data_drop
mkdir -p admin/db
mkdir -p public/assets
mkdir -p .github/workflows
mkdir -p scripts

# -----------------------------------------------------------------------------
# 2. GENERATE CORE CONFIGURATION (The Brain)
# -----------------------------------------------------------------------------
cat > codex.config.json <<EOF
{
  "system_name": "Heady-Optimization-Matrix",
  "orchestrator": "Codex",
  "golden_targets": [
    "git@github.com:HeadySystems/Heady.git",
    "git@github.com:HeadyConnection/Heady.git",
    "git@github.com:HeadyConnection/HearySystems.git"
  ],
  "agents": {
    "goose": { "role": "Dynamic Node Manager", "path": "./modules/goose_spawn.js" },
    "yandex": { "role": "Resource Allocator", "path": "./modules/yandex_allocator.js" },
    "vinci": { "role": "Design Studio", "path": "./modules/vinci_studio.js" },
    "orion": { "role": "Data Archivist", "watch": "./admin/data_drop", "store": "./admin/db" }
  }
}
EOF

# -----------------------------------------------------------------------------
# 3. GENERATE AGENT MODULES
# -----------------------------------------------------------------------------

# GOOSE (Dynamic Node Manager)
cat > modules/goose_spawn.js <<EOF
const cluster = require('cluster');
const http = require('http');
const os = require('os');
const yandex = require('./yandex_allocator');

if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(\`[Goose] Spawning \${numCPUs} rapid-fire nodes...\`);
    for (let i = 0; i < numCPUs; i++) cluster.fork();
    cluster.on('exit', () => cluster.fork());
} else {
    (async () => {
        await yandex.allocate(); // Warmup
        http.createServer((req, res) => {
            res.writeHead(200);
            res.end("Node Active");
        }).listen(3000);
    })();
}
EOF

# YANDEX (Resource Allocator)
cat > modules/yandex_allocator.js <<EOF
const CACHE = new Map();
module.exports = {
    allocate: async () => {
        if (!CACHE.has('config')) CACHE.set('config', { status: 'optimized' });
        return CACHE.get('config');
    }
};
EOF

# VINCI (Graphic Designer)
cat > modules/vinci_studio.js <<EOF
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const ASSETS = './public/assets';

async function optimize() {
    if (!fs.existsSync(ASSETS)) return;
    const files = fs.readdirSync(ASSETS);
    for (const file of files) {
        if (file.match(/\.(jpg|png)$/)) {
            await sharp(path.join(ASSETS, file)).webp().toFile(path.join(ASSETS, file.replace(/\.\w+$/, '.webp')));
        }
    }
}
optimize();
EOF

# ORION (Data Archivist & 3D Vectorizer)
cat > modules/orion_archivist.js <<EOF
const chokidar = require('chokidar');
const lancedb = require('lancedb');
const { pipeline } = require('@xenova/transformers');
const fs = require('fs-extra');
const path = require('path');

const DROP = './admin/data_drop';
const DB = './admin/db';

async function start() {
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const db = await lancedb.connect(DB);
    const table = await db.createTable('vectors', [{ vector: Array(384).fill(0), text: 'init' }], { mode: 'overwrite' });

    chokidar.watch(DROP).on('add', async (file) => {
        console.log(\`[Orion] Vectorizing: \${path.basename(file)}\`);
        const content = await fs.readFile(file, 'utf-8');
        const output = await embedder(content, { pooling: 'mean', normalize: true });
        await table.add([{ vector: Array.from(output.data), text: content }]);
        console.log(\`[Orion] Stored in 3D Context.\`);
        // In a real scenario, we would now delete the original file
        // await fs.unlink(file);
    });
}
start();
EOF

# -----------------------------------------------------------------------------
# 4. GENERATE PACKAGE.JSON
# -----------------------------------------------------------------------------
cat > package.json <<EOF
{
  "name": "heady-golden-master",
  "version": "2.0.0",
  "main": "modules/goose_spawn.js",
  "scripts": {
    "start": "node modules/goose_spawn.js",
    "design": "node modules/vinci_studio.js",
    "archive": "node modules/orion_archivist.js",
    "cleanup": "node scripts/archive_to_vector.js",
    "sync": "bash scripts/golden-sync.sh"
  },
  "dependencies": {
    "sharp": "^0.32.0",
    "fs-extra": "^11.0.0",
    "lancedb": "^0.4.0",
    "@xenova/transformers": "^2.6.0",
    "chokidar": "^3.5.3",
    "pca-js": "^1.0.0"
  }
}
EOF

# -----------------------------------------------------------------------------
# 5. GENERATE UTILITY SCRIPTS
# -----------------------------------------------------------------------------

# ARCHIVE CLEANUP SCRIPT (Moves legacy files to Orion)
cat > scripts/archive_to_vector.js <<EOF
const fs = require('fs-extra');
const path = require('path');

const ROOT = '.';
const DROP = './admin/data_drop';
const EXCLUDE = ['node_modules', '.git', 'modules', 'admin', 'scripts', 'public', 'package.json', 'package-lock.json', 'codex.config.json', '.gitignore'];

async function cleanup() {
    const files = await fs.readdir(ROOT);
    for (const file of files) {
        if (!EXCLUDE.includes(file)) {
            console.log(\`[Cleanup] Moving legacy artifact '\${file}' to Orion Data Drop...\`);
            await fs.move(path.join(ROOT, file), path.join(DROP, file), { overwrite: true });
        }
    }
    console.log('[Cleanup] Complete. Start Orion to vectorize these files.');
}
cleanup();
EOF

# GOLDEN SYNC SCRIPT (3-Way Force Push)
cat > scripts/golden-sync.sh <<EOF
#!/bin/bash
# Targets defined in codex.config.json
TARGETS=(
  "git@github.com:HeadySystems/Heady.git"
  "git@github.com:HeadyConnection/Heady.git"
  "git@github.com:HeadyConnection/HearySystems.git"
)

echo "Starting Golden Master Sync..."

# Ensure we have a clean slate
git add .
git commit -m "Golden Master Update: \$(date)" || echo "Nothing to commit"

for repo in "\${TARGETS[@]}"; do
    echo "Pushing to \$repo..."
    git push "\$repo" master --force
done

echo "Golden Master State Enforced on all nodes."
EOF
chmod +x scripts/golden-sync.sh

echo "Golden Master Generation Complete."
echo "Run 'npm install' to initialize the agents."
echo "Run 'npm run cleanup' to move old files to the Data Drop."
echo "Run 'npm run sync' to push to the 3 repositories."
