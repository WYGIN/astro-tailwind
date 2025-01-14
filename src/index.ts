import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import autoprefixerPlugin from "autoprefixer";
import tailwindPlugin from "tailwindcss";
import type { CSSOptions, UserConfig } from "vite";

async function getPostCssConfig(
  root: UserConfig["root"],
  postcssInlineOptions: CSSOptions["postcss"],
) {
  let postcssConfigResult;
  // Check if postcss config is not inlined
  if (
    !(typeof postcssInlineOptions === "object" && postcssInlineOptions !== null)
  ) {
    const { default: postcssrc } = await import("postcss-load-config");
    const searchPath =
      typeof postcssInlineOptions === "string" ? postcssInlineOptions : root!;
    try {
      postcssConfigResult = await postcssrc({}, searchPath);
    } catch {
      postcssConfigResult = null;
    }
  }
  return postcssConfigResult;
}

async function getViteConfiguration(
  tailwindConfigPath: string | undefined,
  nesting: boolean,
  root: string,
  postcssInlineOptions: CSSOptions["postcss"],
): Promise<Partial<UserConfig>> {
  // We need to manually load postcss config files because when inlining the tailwind and autoprefixer plugins,
  // that causes vite to ignore postcss config files
  const postcssConfigResult = await getPostCssConfig(
    root,
    postcssInlineOptions,
  );

  const postcssOptions = postcssConfigResult?.options ?? {};
  const postcssPlugins = postcssConfigResult?.plugins?.slice() ?? [];

  if (nesting) {
    const tailwindcssNestingPlugin = (
      await import("tailwindcss/nesting/index.js")
    ).default;
    postcssPlugins.push(tailwindcssNestingPlugin());
  }

  postcssPlugins.push(tailwindPlugin(tailwindConfigPath));
  postcssPlugins.push(autoprefixerPlugin());

  return {
    css: {
      postcss: {
        ...postcssOptions,
        plugins: postcssPlugins,
      },
    },
  };
}

type TailwindOptions = {
  path: string;
  /**
   * Path to your tailwind config file
   * @default 'tailwind.config.mjs'
   */
  configFile?: string;
  /**
   * Add CSS nesting support using `tailwindcss/nesting`. See {@link https://tailwindcss.com/docs/using-with-preprocessors#nesting Tailwind's docs}
   * for how this works with `postcss-nesting` and `postcss-nested`.
   */
  nesting?: boolean;
};

export default function tailwindIntegration(
  options: TailwindOptions,
): AstroIntegration {
  return {
    name: "tailwindcss",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig, injectScript }) => {
        const customConfigPath = options?.configFile;
        const nesting = options?.nesting ?? false;

        updateConfig({
          vite: await getViteConfiguration(
            customConfigPath,
            nesting,
            fileURLToPath(config.root),
            config.vite.css?.postcss,
          ),
        });

        injectScript(
          "page-ssr",
          `import "${fileURLToPath(new URL(options.path, config.srcDir))}"`,
        );
      },
    },
  } satisfies AstroIntegration;
}
