/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
const bind = (i18nKey) => (props) => createElement(Trans, { i18nKey, ns: "ns", ...props })
export function useMyHooks() {
    const { t } = useTranslation("ns")
    return useMemo(
        () => ({
            ["normal_key"]: () => t("normal_key"), ["with_param"]: x => t("with_param", x), ["with_prop_access"]: x => t("with_prop_access", x), ["unescaped"]: x => t("unescaped", x), ["formatted"]: x => t("formatted", x), ["key_zero"]: () => t("key_zero"), ["key_one"]: () => t("key_one"), ["key_two"]: () => t("key_two"), ["key_few"]: () => t("key_few"), ["key_many"]: () => t("key_many"), ["key_other"]: () => t("key_other")
        }),
        [t],
    )
}
export const TypedMyTrans = {["with_tag"]: bind("with_tag")}