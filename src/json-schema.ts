/**
 * This file must not contains any complex TypeScript knowledge that cannot be understand by https://app.quicktype.io/
 * We use this tool to generate JSON Schema for the config file.
 *
 * Don't forget to add these lines under the JSON:
    "type": "object",
    "$ref": "#/definitions/ConfigFile"
 */

/** #TopLevel */
/** Configuration format of i18n-codegen */
export type ConfigFile = { version: 1; list: Config[] }
/**
 * Each configuration entry
 */
export interface Config {
    /** The input file, must be a JSON (can be a JSON with comment) */
    input: string
    /** The base name of the output files. It might generate multiple files. */
    output: string
    parser: ParserList | ({ type: ParserList.i18next } & Parser_I18NextConfig)
    generator: GeneratorList | ({ type: GeneratorList.i18next_reactHooks } & Generator_I18Next_ReactHooks)
}
export enum ParserList {
    i18next = 'i18next',
}
export enum GeneratorList {
    i18next_reactHooks = 'i18next/react-hooks',
}
//#region i18next
export interface Parser_I18NextConfig {
    nsSeparator?: string
    pluralSeparator?: string
    contextSeparator?: string
}
export interface Generator_I18Next_ReactHooks {
    /** The namespace of this generator should use */
    namespace?: string
    /** The hooks name, must starts with "use" */
    hooks?: string
    /** The component name that provides typed version of Trans component. */
    trans?: string
    /**
     * Generate sourcemap for .d.ts file
     * @default true
     */
    sourceMap?: boolean | 'inline'
    /**
     * Use ES6 Proxy for .js file
     * @default true
     */
    es6Proxy?: boolean
}
//#endregion
