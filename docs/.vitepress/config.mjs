import { defineConfig } from "vitepress";

export default defineConfig({
  title: "🔒 StatiCrypt",
  description:
    "Password protect static HTML files with browser-based AES encryption.",
  base: "/staticrypt/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Usage", link: "/guide" },
      { text: "Reference", link: "/reference" },
    ],
    sidebar: {
      "/": [
        {
          text: "Documentation",
          items: [
            { text: "Home", link: "/" },
            { text: "Usage", link: "/guide" },
            { text: "Reference", link: "/reference" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/royfrancis/staticrypt" },
    ],
    editLink: {
      pattern:
        "https://github.com/royfrancis/staticrypt/edit/develop/docs/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: new Date().getFullYear() + " • Roy Francis",
    },
  },
});
