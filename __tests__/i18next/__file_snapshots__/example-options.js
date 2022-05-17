/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
const bind = (i18nKey) => (props) => createElement(Trans, { i18nKey, ns: "ns", ...props })
export function useMyHooks() {
    const { t } = useTranslation("ns")
    return useMemo(
        () => ({
            ["normal_key"]: () => t("normal_key"), ["with_param"]: x => t("with_param", x), ["with_prop_access"]: x => t("with_prop_access", x), ["unescaped"]: x => t("unescaped", x), ["formatted"]: x => t("formatted", x), ["key$zero"]: () => t("key$zero"), ["key$one"]: () => t("key$one"), ["key$two"]: () => t("key$two"), ["key$few"]: () => t("key$few"), ["key$many"]: () => t("key$many"), ["key$other"]: x => t("key$other", x), ["key"]: x => t("key", x)
        }),
        [t],
    )
}
export const TypedMyTrans = {["with_tag"]: bind("with_tag")}