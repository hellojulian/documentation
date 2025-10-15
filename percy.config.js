module.exports = {
  version: 2,
  snapshot: {
    widths: [375, 1280],
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic timestamps during visual testing */
      [data-testid="last-sync"],
      .last-sync {
        display: none !important;
      }
    `
  },
  discovery: {
    allowedHostnames: ['localhost'],
    networkIdleTimeout: 750
  }
};