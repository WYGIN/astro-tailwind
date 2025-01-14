import type { AstroIntegration } from "astro";
import tailwind from "@astrojs/tailwind";

type TailwindOptions = {
  path: string;
};

export default function tailwindIntegration(
  options: TailwindOptions,
): AstroIntegration {
  return {
    name: "tailwindcss",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig, injectScript }) => {
        const twIntegration = config.integrations.find(
          ({ name }) => name === "@astrojs/tailwind",
        );
        if (!twIntegration) {
          updateConfig({
            vite: {
              plugins: [tailwind({ applyBaseStyles: false })],
            },
          });
        }
        injectScript("page-ssr", `import "${options.path}"`);
      },
    },
  } satisfies AstroIntegration;
}
