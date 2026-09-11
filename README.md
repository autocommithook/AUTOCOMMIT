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
| Build | #000019 |
| Tape | 33 / 256 instructions |
| Tape hash | `0x571fa5e839c5937469a66db62f4391b7c726b6544adf402a99b83619b4adb232` |
| Authors in this build | [12](live/authors.json) |
| Sealed builds | [18](builds/) |
| Finalized through | [25957369](https://etherscan.io/block/25957369) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0x529aa2bc…](https://etherscan.io/tx/0x529aa2bcf4661c09d9f4c3c2dc5c7d93947cc56e60b7cf5ec1884c341169f8a6) |

```asm
DROP
PUSH
PUSH
COPY
RETURN
BREAK
JUMP
BREAK
RETURN
LOCK
BREAK
CHECK
LOCK
CHECK
MOVE
ADD
CHECK
LOCK
CHECK
SHIFT
LINK
OPEN
PUSH
PUSH
JUMP
DROP
PUSH
RETURN
LINK
MOVE
DROP
RETURN
RETURN
```

[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)

A build seals when the final opcode is HALT and the tape has at least 8 instructions.

Latest sealed build: [#000018](builds/000018/program.asm) — **VERIFIED**.

Finalizer: [0x4313c378cc91ea583c91387b9216e2c03096b27f](https://etherscan.io/address/0x4313c378cc91ea583c91387b9216e2c03096b27f) · [Sealing transaction](https://etherscan.io/tx/0x908db5699c5ee3adbc595dbc582ad043207af78b920d16fc7f6cb93a8b898581).

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
