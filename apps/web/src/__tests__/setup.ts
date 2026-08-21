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

// Mock scrollIntoView since it doesn't exist in jsdom (the test environment)
window.HTMLElement.prototype.scrollIntoView = function() {};
