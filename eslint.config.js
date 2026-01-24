
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["**/*.tsx", "**/*.ts"],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        }
    }
];
