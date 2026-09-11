# Synthetic examples

These files are deterministic test fixtures, **not Ethereum data**. The address, block, transaction and checkpoint hashes are placeholders. `VERIFIED` in the example metadata means the synthetic event history is internally consistent only.

Build 1 seals eight instructions: PUSH, MOVE, XOR, COPY, LINK, CHECK, SHIFT, HALT. Build 2 writes BREAK and then ROTATE exposes MOVE left in physical slot 1 from build 1. This demonstrates why the ring snapshot must survive sealing.

Regenerate with `npm run examples`. Real commands write the separate root `live/` and `builds/` directories.
