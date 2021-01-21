/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
const bind = (i18nKey) => (props) => createElement(Trans, { i18nKey, ...props })
export function useTypedTranslation() {
    const { t } = useTranslation()
    return useMemo(
        () => ({
            ["normal_key"]: () => t("normal_key"), ["with_param"]: x => t("with_param", x), ["with_prop_access"]: x => t("with_prop_access", x), ["unescaped"]: x => t("unescaped", x), ["formatted"]: x => t("formatted", x)
        }),
        [t],
    )
}
export const TypedTrans = { ["with_tag"]: bind("with_tag") }
