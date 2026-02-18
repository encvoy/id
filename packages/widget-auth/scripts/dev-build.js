const { spawn } = require('child_process');
const chokidar = require('chokidar');

let building = false;
let buildTimeout = null;
let rebuildQueued = false;

function build() {
  if (building) {
    console.log('⏳ Build already in progress, queuing rebuild...');
    rebuildQueued = true;
    return;
  }

  building = true;
  rebuildQueued = false;
  console.log('\n🔨 Building...');

  // Remove stale lock
  const { execSync } = require('child_process');
  try {
    execSync('rm -f .next/lock');
  } catch (e) {
    // ignore
  }

  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
  });

  buildProcess.on('close', (code) => {
    building = false;
    if (code === 0) {
      console.log('✅ Build complete\n');
    } else {
      console.error('❌ Build failed\n');
    }
    if (rebuildQueued) {
      console.log('🔄 Rebuilding due to queued changes...');
      build();
    }
  });
}

function debouncedBuild() {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }

  console.log('⏱️  Waiting 1s for more changes...');

  buildTimeout = setTimeout(() => {
    if (!building) {
      build();
    } else {
      rebuildQueued = true;
    }
  }, 1000);
}

console.log('👀 Watching for changes...');

// Watch src directory
const watcher = chokidar.watch('src', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
  usePolling: false,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher
  .on('ready', () => {
    console.log('✅ Watcher ready');
  })
  .on('change', (path) => {
    console.log(`\n📝 File changed: ${path}`);
    debouncedBuild();
  })
  .on('add', (path) => {
    console.log(`\n➕ File added: ${path}`);
    debouncedBuild();
  })
  .on('unlink', (path) => {
    console.log(`\n🗑️  File removed: ${path}`);
    debouncedBuild();
  })
  .on('error', (error) => {
    console.error(`❌ Watcher error: ${error}`);
  });

// Initial build
build();
