import { build } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';
import { IApi } from 'umi';

let devSwBuilt = false;

export default (api: IApi) => {
  api.describe({
    key: 'serviceWorker',
    config: {
      schema(joi) {
        return joi.object({
          enable: joi.boolean().default(true),
          swSrc: joi.string().default('src/service-worker.ts'),
          swDest: joi.string().default('sw.js'),
        });
      },
    },
  });

  // Generate sw-register file in tmp directory
  api.onGenerateFiles(() => {
    const { enable, swDest } = api.config.serviceWorker || {};
    if (!enable) return;

    api.writeTmpFile({
      path: 'plugin-sw/sw-register.ts',
      content: `
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/${swDest || 'sw.js'}')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New version available');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });
}
      `.trim(),
    });
  });

  // Add entry code imports using relative path from tmp
  api.addEntryCodeAhead(() => {
    const { enable } = api.config.serviceWorker || {};
    if (!enable) return '';

    return `import './plugin-serviceWorker/plugin-sw/sw-register';`;
  });

  // Add middleware to serve SW file in dev mode with correct MIME type
  api.addMiddlewares(() => {
    const { enable, swDest } = api.config.serviceWorker || {};
    if (!enable) return [];

    return [
      (req: any, res: any, next: any) => {
        const swPath = `/${swDest || 'sw.js'}`;

        if (req.url === swPath || req.url === swPath + '.map') {
          const isMap = req.url.endsWith('.map');
          const filePath = join(
            api.cwd,
            'public',
            isMap ? `${swDest || 'sw.js'}.map` : swDest || 'sw.js',
          );

          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader(
              'Content-Type',
              isMap ? 'application/json' : 'application/javascript',
            );
            res.setHeader('Cache-Control', 'no-cache');
            res.end(content);
            return;
          }
        }
        next();
      },
    ];
  });

  // Build SW file into dist on production build
  api.onBuildComplete(async () => {
    const { enable, swSrc, swDest } = api.config.serviceWorker || {};
    if (!enable) return;

    const srcFile = join(api.cwd, swSrc || 'src/service-worker.ts');
    const outFile = join(api.paths.absOutputPath!, swDest || 'sw.js');

    if (!fs.existsSync(srcFile)) {
      console.warn(`⚠️ [SW] Source not found: ${srcFile}`);
      return;
    }

    try {
      await build({
        entryPoints: [srcFile],
        outfile: outFile,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        format: 'iife',
        target: ['es2020'],
        define: {
          'process.env.NODE_ENV': JSON.stringify(
            process.env.NODE_ENV || 'production',
          ),
        },
      });

      console.log(`✅ [SW] Built service worker to dist/${swDest || 'sw.js'}`);
    } catch (error) {
      console.error('❌ [SW] Build failed:', error);
    }
  });

  // Build SW file before dev server starts
  api.onBeforeMiddleware(async () => {
    const { enable, swSrc, swDest } = api.config.serviceWorker || {};
    if (!enable || devSwBuilt) return;

    const srcFile = join(api.cwd, swSrc || 'src/service-worker.ts');
    const outDir = join(api.cwd, 'public');
    const outFile = join(outDir, swDest || 'sw.js');

    if (!fs.existsSync(srcFile)) {
      console.warn(`⚠️ [SW] Source not found: ${srcFile}`);
      return;
    }

    fs.ensureDirSync(outDir);

    try {
      await build({
        entryPoints: [srcFile],
        outfile: outFile,
        bundle: true,
        minify: false,
        sourcemap: true,
        format: 'iife',
        target: ['es2020'],
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
      });

      devSwBuilt = true;
      console.log(
        `✅ [SW] Built service worker for dev at public/${swDest || 'sw.js'}`,
      );
    } catch (error) {
      console.error('❌ [SW] Dev build failed:', error);
    }
  });

  // Watch SW source file for changes in dev mode
  api.addTmpGenerateWatcherPaths(() => {
    const { enable, swSrc } = api.config.serviceWorker || {};
    if (!enable) return [];

    return [join(api.cwd, swSrc || 'src/service-worker.ts')];
  });

  // Rebuild SW when source changes
  api.onGenerateFiles(async () => {
    // Only in dev mode and after initial build
    if (process.env.NODE_ENV === 'production' || !devSwBuilt) return;

    const { enable, swSrc, swDest } = api.config.serviceWorker || {};
    if (!enable) return;

    const srcFile = join(api.cwd, swSrc || 'src/service-worker.ts');
    const outFile = join(api.cwd, 'public', swDest || 'sw.js');

    if (!fs.existsSync(srcFile)) return;

    try {
      await build({
        entryPoints: [srcFile],
        outfile: outFile,
        bundle: true,
        minify: false,
        sourcemap: true,
        format: 'iife',
        target: ['es2020'],
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
      });
      console.log(`🔄 [SW] Rebuilt service worker`);
    } catch (error) {
      console.error('❌ [SW] Rebuild failed:', error);
    }
  });
};
