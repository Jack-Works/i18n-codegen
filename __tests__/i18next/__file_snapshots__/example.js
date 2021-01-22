/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
const bind = (i18nKey) => (props) => createElement(Trans, { i18nKey, ...props })
export function useTypedTranslation() {
    const { t } = useTranslation()
    return useMemo(
        function proxyBasedHooks() {
    return new Proxy({ __proto__: null }, {
        get(target, key) {
            if (target[key])
                return target[key];
            return (target[key] = t.bind(null, key));
        },
    });
}
        [t],
    )
}
export const TypedTrans = function proxyBasedTrans() {
    return new Proxy({ __proto__: null }, {
        get(target, key) {
            if (target[key])
                return target[key];
            return (target[key] = bind(key));
        },
    });
}()