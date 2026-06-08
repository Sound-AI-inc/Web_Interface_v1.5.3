export const COMPOSER_INPUT_ID = "generator-composer-input";

export function focusComposerInput() {
  requestAnimationFrame(() => {
    document.getElementById(COMPOSER_INPUT_ID)?.focus();
  });
}
