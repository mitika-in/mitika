// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  components: {
    dirs: [{ path: "~/components/icons", pathPrefix: false }, "~/components"],
  },
  css: ["~/assets/css/style.css"],
  ssr: false,
  devtools: { enabled: false },
  i18n: {
    locales: [
      {
        code: "en",
        file: "en-US.ts",
      },
    ],
    lazy: true,
    defaultLocale: "en",
  },
  modules: ["@nuxtjs/i18n"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["mupdf"], // Exclude mupdf from pre-bundling
    },
  },
});
