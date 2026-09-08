# Voxels

Voxels is a local-first equation puzzle game. Build target shapes on a 2D
coordinate grid or in a 3D voxel world by writing mathematical expressions.
It has no accounts, database, leaderboard, analytics, or player-data service.

## Game modes

- **Plane Lab:** 12 sequential levels using `x` and `y`.
- **Volume Lab:** 12 sequential levels using `x`, `y`, and `z`.
- **Sandbox:** free 2D and 3D creation without a target or score.

Each campaign level awards up to three blocks for completion, avoiding hints,
and using an efficient expression. The 3D renderer uses instanced rounded
geometry, a clay material shader, procedural surface detail, soft lighting,
ambient occlusion, shadows, and camera presets. High quality is the desktop
default; Auto reduces effects on mobile or when sustained performance drops.

## Equation language

Expressions are parsed by the application and evaluated in a Web Worker. They
are never passed to `eval` or `new Function`.

Supported features include:

- Variables: `x`, `y`, `z`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparisons: `<`, `<=`, `>`, `>=`, `==`, `!=`
- Logic: `&&`, `||`, `!`
- Conditional expressions: `condition ? valueA : valueB`
- Functions: `abs`, `min`, `max`, `sqrt`, `floor`, `ceil`, `round`, `pow`

Return `false` or `0` for an empty cell, `true` for the default material, or an
integer from `1` through `8` for a colored material.

## Local data

The browser stores three independent records:

```text
voxels:level-progress:v1
voxels:sandbox-draft:v1
voxels:settings:v1
```

Settings includes a confirmed **Reset level progress** action. It removes only
the first record, so Sandbox drafts and graphics quality remain unchanged.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```
