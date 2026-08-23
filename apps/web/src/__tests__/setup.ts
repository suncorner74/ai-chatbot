import '@testing-library/jest-dom';

/**
 * Vitest setup file.
 *
 * Imports jest-dom matchers so we can use assertions like:
 * expect(element).toBeInTheDocument()
 * expect(button).toBeDisabled()
 *
 * This file is executed by Vitest before every test file.
 */

window.HTMLElement.prototype.scrollIntoView = function() {};
window.HTMLElement.prototype.scrollTo = function(options?: ScrollToOptions | number) {
  if (typeof options === 'number') {
    this.scrollTop = options;
    return;
  }

  if (options && typeof options === 'object') {
    this.scrollTop = options.top ?? this.scrollTop;
  }
};
