import { defineConfig } from '@umijs/max';

export default defineConfig({
  mock: false,
  esbuildMinifyIIFE: true,
  apiRoute: {
    platform: 'vercel',
  },

  plugins: [require.resolve('./plugins/sw')],
  serviceWorker: {
    enable: true,
    swSrc: 'src/service-worker.ts',
    swDest: 'sw.js',
  },

  headScripts: [],
  scripts: [
    {
      src: '//unpkg.com/react-scan/dist/auto.global.js',
      crossOrigin: 'anonymous',
    },
  ],

  antd: {
    import: true,
    // style: 'css-in-js',

    // configProvider
    configProvider: {},
    // themes
    dark: true,
    compact: true,
    // shortcut of `configProvider.theme`
    // used to configure theme token, antd v5 only
    // theme: {},
    // antd <App /> valid for version 5.1.0 or higher, default: undefined
    appConfig: {},
    // Transform DayJS to MomentJS
    momentPicker: false,
    // Add StyleProvider for legacy browsers
    styleProvider: {
      hashPriority: 'high',
      legacyTransformer: true,
    },
  },
  cssLoader: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  reactQuery: {},
  layout: false,
  routes: [
    {
      path: '/',
      component: '@/layouts/BasicLayout',
      routes: [
        {
          path: '/',
          redirect: '/home',
        },
        {
          name: 'Home',
          path: '/home',
          component: './Home',
        },
        {
          name: 'Users',
          path: '/users',
          component: './Users',
        },
        {
          name: 'Projects',
          path: '/projects',
          component: './Projects',
        },
        {
          name: 'Project Detail',
          path: '/projects/:id',
          component: './Projects/[id]',
        },
        {
          name: 'Access',
          path: '/access',
          component: './Access',
        },
        {
          name: 'Table',
          path: '/table',
          component: './Table',
        },
        {
          name: 'Dynamic',
          path: '/dynamic',
          component: './Dynamic',
        },
        {
          name: 'Service Worker',
          path: '/service-worker',
          component: './ServiceWorker',
        },
        {
          name: 'Formik Demo',
          path: '/formik',
          component: './FormikDemo',
        },
        {
          name: 'RHF Demo',
          path: '/rhf',
          component: './RHFDemo',
        },
        {
          name: 'Dependent Field',
          path: '/dependent-field',
          component: './DependentFieldDemo',
        },
      ],
    },
  ],

  npmClient: 'pnpm',
  tailwindcss: {},
  fastRefresh: true,
});
