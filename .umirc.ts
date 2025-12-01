import { defineConfig } from '@umijs/max';

export default defineConfig({
  mock: false,
  apiRoute: {
    platform: 'vercel',
  },
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
    momentPicker: true,
    // Add StyleProvider for legacy browsers
    styleProvider: {
      hashPriority: 'high',
      legacyTransformer: true,
    },
  },
  lessLoader: false,
  cssLoader: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  plugins: [],
  reactQuery: {
    devtool: true,
    queryClient: true,
  },
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
      ],
    },
  ],

  npmClient: 'pnpm',
  tailwindcss: {},
});
