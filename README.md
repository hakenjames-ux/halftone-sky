# Halftone Sky

A Claude Code theme: a royal-blue sky with white cumulus clouds, printed in
halftone dots with the fine horizontal lines of an old print.

- **Backdrop**: the clouds are drawn as soft shaded light, then printed as real
  halftone, so each dot grows with how bright the cloud is beneath it. The sky
  keeps a flat royal blue with a fine dot grain and faint print streaks. It holds
  still, so it costs nothing once drawn.
- **Light mode**: pale cloud-white panels with navy text and the royal blue as the
  accent.
- **Dark mode**: deep royal-blue panels with white text.
- **Messages**: your messages are sky-blue bubbles; Claude's replies and tool
  calls sit on soft cloud cards.

The theme draws in the Claude desktop and mobile apps. A plain terminal doesn't
draw themes, so there it does nothing.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install halftone-sky --marketplace hakenjames-ux/halftone-sky
```

Answer `y` to add the marketplace, then press Enter to install it for your user
(every session from then on).

From a shell:

```bash
claude plugin install halftone-sky --marketplace hakenjames-ux/halftone-sky
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt
box, then **Plugins**, **Add marketplace** with `hakenjames-ux/halftone-sky`, then
**Add plugin**.

## Files

- `hooks/register.tsx`: sets the theme when a session starts and draws the
  backdrop.
- `hooks/make-colors.js`: Claude Code's helper that turns a few colours into a
  full palette.
