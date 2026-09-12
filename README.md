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
| Build | #000043 |
| Tape | 6 / 256 instructions |
| Tape hash | `0xebf9a87333e277126f8659a755cbd28f5588c9645f84bc66d66fcd621b70fe04` |
| Authors in this build | [2](live/authors.json) |
| Sealed builds | [42](builds/) |
| Finalized through | [25964639](https://etherscan.io/block/25964639) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0xb6c2154b…](https://etherscan.io/tx/0xb6c2154b97c444de45e4a342bdfe85d07970c928b0b9dbce8c113ce8dc550352) |

```asm
LOCK
SWAP
SWAP
BREAK
LINK
RETURN
```

[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)

A build seals when the final opcode is HALT and the tape has at least 8 instructions.

Latest sealed build: [#000042](builds/000042/program.asm) — **VERIFIED**.

Finalizer: [0x666fedd4cdd4e890a5ad20e7b60975409435a64a](https://etherscan.io/address/0x666fedd4cdd4e890a5ad20e7b60975409435a64a) · [Sealing transaction](https://etherscan.io/tx/0xacec2f2d71cb6cbcb7ecfdfbb343c6bc324760431ccaeeca91289302311edb81).

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
