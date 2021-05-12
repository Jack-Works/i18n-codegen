import { Token, GeneratorInput } from '../../../type'
import { Position } from '../../../utils/position'
import { Source } from '../../../utils/source'
// @ts-ignore private api
import { isIdentifierText, ScriptTarget } from 'typescript'
import { I18NextResult, I18NextResultExtra } from '../parser/types'
import { basename } from 'path'
import { Generator_I18Next_ReactHooks } from '../../../json-schema'

type GenType = GeneratorInput<I18NextResultExtra, Generator_I18Next_ReactHooks>

export function i18NextReactHooksGenerator(gen: GenType) {
    return new Map([[gen.outputBase + '.js', generateJS(gen)], ...Object.entries(generateDTS(gen))])
}

//#region Generate .d.ts and .d.ts.map
function generateDTS(gen: GenType) {
    const relativeSourceFilePath = gen.outputRelativePathToInput
    const items = getTopLevelItems(gen.parseResult)

    const node = new Source()

    const htmlTags: typeof items = new Map()
    //#region useTypedTranslation
    node.addLine(
        `export function `,
        new Source(1, 0, relativeSourceFilePath, gen.generatorOptions?.hooks || 'useTypedTranslation', ''),
        '(): {',
    )
    for (const [key, detail] of items) {
        if (detail.type !== 'key') continue // TODO
        if (detail.tags.size) {
            htmlTags.set(key, detail)
            continue
        }
        node.addLine(appendComment(detail.value, detail.value_position))
        // key(
        node.append('    ', stringifiedKey(key, detail.value_position, detail.value), '(')
        if (detail.interpolations.size) {
            // key(options: { ... }
            node.append('options: ', appendAttributes(detail.interpolations, 'string'))
        }
        // key(): string
        node.addLine('): string')
    }
    node.addLine('}')
    //#endregion

    //#region TypedTrans
    if (htmlTags.size) {
        node.addLine(`export declare const ${gen.generatorOptions?.trans || 'TypedTrans'}: {`)
        for (const [key, detail] of htmlTags) {
            if (detail.type !== 'key') continue // TODO
            node.addLine(appendComment(detail.value, detail.value_position))
            // key: React.ComponentType<TypedTransProps<{ ['what']: string }, { ['italic']: JSX.Element }>>
            node.append('    ', stringifiedKey(key, detail.value_position), ': React.ComponentType<TypedTransProps<')
            node.append(
                appendAttributes(detail.interpolations, 'string'),
                ', ',
                appendAttributes(detail.tags, 'JSX.Element'),
            )
            node.addLine('>>')
        }
        node.addLine('}')
    }
    htmlTags.size &&
        node.addLine(`import { TransProps } from 'react-i18next'
type TypedTransProps<Value, Components> = Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> & ({} extends Value ? {} : { values: Value }) & { components: Components }`)
    //#endregion
    const useSourceMap = gen.generatorOptions?.sourceMap !== false
    const useInlineSourceMap = useSourceMap && gen.generatorOptions?.sourceMap === 'inline'
    const dtsPath = gen.outputBase + '.d.ts'
    if (!useSourceMap) return { [dtsPath]: node.toString() }

    const sourceMapOption = { file: basename(gen.outputBase) + '.d.ts' }
    if (useInlineSourceMap) return { [dtsPath]: node.toStringWithInlineSourceMap(sourceMapOption) }

    const s = node.toStringWithSourceMap(sourceMapOption)
    return { [dtsPath]: s.code, [gen.outputBase + '.d.ts.map']: JSON.stringify(s.map, undefined, 4) }

    function appendComment(value: string, pos: Position) {
        if (!value.includes('*/')) {
            return Source.of('    /** `', value, '` */')
        }
        return ''
    }
    function appendAttributes(attrs: Map<string, Token>, mappedType: string) {
        if (attrs.size === 0) return '{}'
        const attrNodes = [...attrs].map(([attr, token]) =>
            Source.of(stringifiedKey(attr, token.position), ': ', mappedType),
        )
        return Source.of('{ ', Source.of(...attrNodes).join(', '), ' }')
    }
    function stringifiedKey(key: string, pos: Position, orig = key) {
        const needEscape = !isIdentifier(key)
        return new Source(
            ...pos,
            relativeSourceFilePath,
            needEscape ? `[${JSON.stringify(key)}]` : key,
            !needEscape && orig === key ? undefined : orig,
        )
    }
}
//#endregion

//#region Generate JS, don't need sourcemap so we join the text directly
function generateJS(gen: GenType): string {
    const items = getTopLevelItems(gen.parseResult)
    const ns = gen.generatorOptions?.namespace
    const useProxy = gen.generatorOptions?.es6Proxy !== false
    return `/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
const bind = (i18nKey) => (props) => createElement(Trans, { i18nKey, ${
        ns ? `ns: ${JSON.stringify(ns)}, ` : ''
    }...props })
export function ${gen.generatorOptions?.hooks || 'useTypedTranslation'}() {
    const { t } = useTranslation(${ns ? JSON.stringify(ns) : ''})
    return useMemo(
        ${
            useProxy
                ? proxyBasedHooks.toString() + ','
                : `() => ({
            ${[...items]
                .map(generateUseTKeys)
                .filter((x) => x)
                .join(', ')}
        }),`
        }
        [t],
    )
}
export const ${gen.generatorOptions?.trans || 'TypedTrans'} = ${
        useProxy
            ? proxyBasedTrans.toString() + '()'
            : `{${[...items]
                  .map(generateComponentBinding)
                  .filter((x) => x)
                  .join(', ')}}`
    }`
}
function generateUseTKeys([k, r]: [k: string, r: I18NextResult]) {
    if (r.type !== 'key') return null
    const key = JSON.stringify(k)
    const prop = `[${key}]` // { ["key"]: ... }
    if (r.tags.size) return null
    if (r.interpolations.size) return `${prop}: x => t(${key}, x)`
    return `${prop}: () => t(${key})`
}
function generateComponentBinding([k, r]: [k: string, r: I18NextResult]) {
    if (r.type !== 'key') return null
    const key = JSON.stringify(k)
    const prop = `[${key}]` // { ["key"]: ... }
    if (!r.tags.size) return null
    return `${prop}: bind(${key})`
}
//#endregion

function isIdentifier(x: string) {
    return isIdentifierText(x, ScriptTarget.ESNext)
}

function getTopLevelItems(x: I18NextResult) {
    if (x.type !== 'object') throw new Error()
    return x.items
}

function proxyBasedHooks() {
    // @ts-ignore
    declare const t: any
    return new Proxy({ __proto__: null } as any, {
        get(target, key) {
            if (target[key]) return target[key]
            return (target[key] = t.bind(null, key))
        },
    })
}
function proxyBasedTrans() {
    // @ts-ignore
    declare const bind: any
    return new Proxy({ __proto__: null } as any, {
        get(target, key) {
            if (target[key]) return target[key]
            return (target[key] = bind(key))
        },
    })
}
