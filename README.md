# Usage

```plain
i18n-codegen [command]

Commands:
  i18n-codegen gen  Generate the i18n files

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -c, --config   Specify a different configuration file
                                      [string] [default: "./.i18n-codegen.json"]
      --cwd      Current working directory                              [string]
  -q, --quite    Don't write to stdout                [boolean] [default: false]
```

# TODO

## i18next parser

-   [ ] Support nested namespace

## i18next generator

-   [ ] Support generation for nested namespace
-   [ ] Support interpolation like `author.name`, should generate as `{ author: { name: string } }`
