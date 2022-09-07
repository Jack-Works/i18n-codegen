import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['./__tests__/i18next/generator.ts', './__tests__/i18next/parser.ts'],
    },
})
