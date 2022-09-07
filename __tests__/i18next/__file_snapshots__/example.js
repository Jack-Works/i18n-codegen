/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
function createProxy(initValue) {
    function define(key) {
        const value = initValue(key);
        Object.defineProperty(container, key, { value, configurable: true });
        return value;
    }
    const container = {
        __proto__: new Proxy({ __proto__: null }, {
            get(_, key) {
                if (typeof key === 'symbol')
                    return undefined;
                return define(key);
            },
        }),
    };
    return new Proxy(container, {
        getPrototypeOf: () => null,
        setPrototypeOf: (_, v) => v === null,
        getOwnPropertyDescriptor: (_, key) => {
            if (typeof key === 'symbol')
                return undefined;
            if (!(key in container))
                define(key);
            return Object.getOwnPropertyDescriptor(container, key);
        },
    });
}
function bind(i18nKey) {
    return (props) => createElement(Trans, { i18nKey, ...props })
}
export function useTypedTranslation() {
    const { t } = useTranslation()
    return useMemo(
        () => createProxy((key) => t.bind(null, key)),
        [t],
    )
}
export const TypedTrans = /*#__PURE__*/ createProxy(bind)