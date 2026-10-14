import type { NextConfig } from "next";

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && {
    distDir: ".next-e2e",
    typescript: { tsconfigPath: "tsconfig.e2e.json" },
  }),

  images: {
    remotePatterns: [
      ...(storageBucket
        ? [
            {
              protocol: "https" as const,
              hostname: "firebasestorage.googleapis.com",
              port: "",
              pathname: `/v0/b/${storageBucket}/o/**`,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/150",
      },
    ],
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              dimensions: false,
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
