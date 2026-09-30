![AUTOCOMMIT](banner.png)

# AUTOCOMMIT

The pool is writing something.

Not a chart.
Not a roadmap.
Not a simulation.

Every move leaves a line behind.

Some lines remain.
Some are rewritten.
Some disappear completely.

The repository changes because the market changes.

There is no author.

There is no final draft.

Only the current state.

---

## LIVE

<!-- AUTOCOMMIT:LIVE:START -->

| Machine | Current state |
| --- | --- |
| Status | BUILDING |
| Build | #000047 |
| Tape | 35 / 256 instructions |
| Tape hash | `0x9324d285152f728c29e6f76dec0635a0c98e05f8e1a2980a649d799ae34749e7` |
| Authors in this build | [18](live/authors.json) |
| Sealed builds | [46](builds/) |
| Finalized through | [26087160](https://etherscan.io/block/26087160) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0xcfb74fd9…](https://etherscan.io/tx/0xcfb74fd97025864a248ecd41e0633e3a910c963924d572a195d976136c1ef769) |

```asm
XOR
SHIFT
COPY
RETURN
CHECK
DROP
SWAP
PUSH
CHECK
LOCK
XOR
OPEN
PUSH
SWAP
PUSH
DROP
COPY
LOCK
SWAP
XOR
MOVE
MOVE
MOVE
LINK
OPEN
ADD
PUSH
ADD
PUSH
ADD
ADD
CHECK
PUSH
SHIFT
SHIFT
```

[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)

A build seals when the final opcode is HALT and the tape has at least 8 instructions.

Latest sealed build: [#000046](builds/000046/program.asm) — **VERIFIED**.

Finalizer: [0x66a9893cc07d91d95644aedd05d03f95e1dba8af](https://etherscan.io/address/0x66a9893cc07d91d95644aedd05d03f95e1dba8af) · [Sealing transaction](https://etherscan.io/tx/0x72ebff14ff2081fc00e09d7ba9387814a021ea1104af934febd897db706ab1c6).

*Snapshot of finalized Ethereum state. This section updates when the sync workflow runs.*

<!-- AUTOCOMMIT:LIVE:END -->

The active program follows the pool.

Every new action can:

WRITE  
EDIT  
REPLACE  
MOVE  
DELETE  
SEAL

Nothing here is manually composed.

What you see is what the pool produced.

---

## BUILDS

Completed programs are preserved.

Each build is a finished state of the machine.

Some are short.

Some survive many edits.

Some reach completion almost immediately.

Once sealed, they remain here permanently.

---

## AUTHORS

There are no traditional authors.

Only addresses that wrote or edited the build.

Their participation remains recorded,

even when an instruction is replaced or deleted.

These are the swap senders emitted by the contract, which may be routers.

---

## FINALIZER

Every build ends with one last action.

One address closes the sequence.

One instruction becomes the final line.

That address becomes the finalizer.

---

## THE REPOSITORY

This repository is not the source.

It is the trace.

The source lives on-chain.

GitHub only shows what happened.

---

## AUTOCOMMIT

The market does not describe the program.

The market writes it.
