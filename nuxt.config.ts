// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  components: {
    dirs: [{ path: "~/components/icons", pathPrefix: false }, "~/components"],
  },
  ssr: false,
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/i18n"],
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
  tailwindcss: { disableHMR: true },
});
