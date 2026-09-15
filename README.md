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
| Tape | 30 / 256 instructions |
| Tape hash | `0x5f8fabd1a71d844452f3704f2547063775967ff412005e8bec5b11cb9c39be3b` |
| Authors in this build | [14](live/authors.json) |
| Sealed builds | [46](builds/) |
| Finalized through | [25986196](https://etherscan.io/block/25986196) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0x9566554d…](https://etherscan.io/tx/0x9566554d04458bff6725ffd6882506b8f8ae724294932b1d22a16e04349fe6dc) |

```asm
XOR
SWAP
OPEN
COPY
LINK
SHIFT
XOR
SHIFT
COPY
SHIFT
CHECK
RETURN
DROP
SHIFT
PUSH
BREAK
LOCK
OPEN
XOR
PUSH
LOCK
SWAP
DROP
COPY
SWAP
LOCK
XOR
COPY
PUSH
LINK
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
