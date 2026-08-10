// @ts-check

'use strict';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dns = require('dns');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withJupyterWorkspaces } = require('@gen3/workspaces/server');

const basePath = process.env.NEXT_PUBLIC_BASEPATH;

dns.setDefaultResultOrder('ipv4first');

const isDev = process.env.NODE_ENV === 'development';
const configuredBasePath = process.env.BASE_PATH || '';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withMDX = require('@next/mdx')({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

// Next configuration with support for writing API to existing common services
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    version: process.env.npm_package_version,
  },
  reactStrictMode: true,
  pageExtensions: ['mdx', 'md', 'jsx', 'js', 'tsx', 'ts'],
  basePath: configuredBasePath,
  transpilePackages: ['@gen3/core', '@gen3/frontend', '@gen3/workspaces'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  webpack: (config, { dev }) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    // @copilotkit/react-core/v2 side-imports an 87KB Tailwind 4 stylesheet for
    // CopilotKit's own React components. We render none of them - the chat UI is
    // Mantine throughout - and Tailwind 3's PostCSS plugin dies on its bare
    // `@layer base` ("no matching @tailwind base directive"). Resolve it to nothing.
    config.resolve.alias = {
      ...config.resolve.alias,
      [path.resolve(
        __dirname,
        'node_modules/@copilotkit/react-core/dist/v2/index.css',
      )]: false,
    };
    return config;
  },
  async rewrites() {
    const workspaceApiRewrite = [
      {
        source: '/workspace-api/:path*',
        destination: '/api/:path*',
      },
      {
        source:
          '/lw-workspace/proxy/jeg-proxy/kernelspecs/python_tf_kubernetes/logo-64x64.png',
        destination: '/icons/kernels/logo-64.png',
      },
    ];
    if (isDev) {
      const GEN3_TARGET =
        process.env.NEXT_PUBLIC_GEN3_API_TARGET || 'https://localhost';

      return [
        ...workspaceApiRewrite,
        { source: '/_status', destination: `${GEN3_TARGET}/_status` },
        { source: '/user/:path*', destination: `${GEN3_TARGET}/user/:path*` },
        {
          source: '/guppy/:path*',
          destination: `${GEN3_TARGET}/guppy/:path*`,
        },
        { source: '/mds/:path*', destination: `${GEN3_TARGET}/mds/:path*` },
        {
          source: '/ai-search/:path*',
          destination: `${GEN3_TARGET}/ai-search/:path*`,
        },
        // Chat's payload cache. In production the portal shares a host with /qag, so this
        // path is same-origin and the session cookie clears the revproxy on its own; here
        // it isn't, which is why dev sends a bearer built from credentials_token instead.
        { source: '/qag/:path*', destination: `${GEN3_TARGET}/qag/:path*` },
        {
          source: '/authz/:path*',
          destination: `${GEN3_TARGET}/authz/:path*`,
        },
        {
          source: '/lw-workspace/:path*',
          destination: `${GEN3_TARGET}/lw-workspace/:path*`,
        },
        {
          source: '/api/v0/submission/:path*',
          destination: `${GEN3_TARGET}/api/v0/submission/:path*`,
        },
        { source: '/wts/:path*', destination: `${GEN3_TARGET}/wts/:path*` },
        {
          source: '/library/lists/:path*',
          destination: `${GEN3_TARGET}/library/lists/:path*`,
        },
        { source: '/job/:path*', destination: `${GEN3_TARGET}/job/:path*` },
        {
          source: '/manifests/:path*',
          destination: `${GEN3_TARGET}/manifests/:path*`,
        },
        {
          source: '/requestor/:path*',
          destination: `${GEN3_TARGET}/requestor/:path*`,
        },
        {
          source: '/index/:path*',
          destination: `${GEN3_TARGET}/index/:path*`,
        },
        {
          source: '/login',
          destination: `${GEN3_TARGET}/login`,
        },
      ];
    } else {
      return workspaceApiRewrite;
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)?', // Matches all pages
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        source: '/Workspaces/(.*)?',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            // 'credentialless' is less strict than 'require-corp' — allows
            // cross-origin iframes without CORP headers, needed in dev when
            // the remote Jupyter server doesn't send COEP headers.
            value: isDev ? 'credentialless' : 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

// IMPORTANT: actually export your config (wrapped by plugins)
module.exports = withMDX(withJupyterWorkspaces(nextConfig));
