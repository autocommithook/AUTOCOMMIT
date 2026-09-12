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
| Build | #000041 |
| Tape | 7 / 256 instructions |
| Tape hash | `0x1089fb82df1727176193478ac01db2283960c42aa0a72d0741cfbda2a8eb68a4` |
| Authors in this build | [6](live/authors.json) |
| Sealed builds | [40](builds/) |
| Finalized through | [25962725](https://etherscan.io/block/25962725) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0x21c039ce…](https://etherscan.io/tx/0x21c039ceacb2a18642dc049ae92915ea6b95cd0b568f3207c620368b33770e96) |

```asm
SWAP
XOR
SWAP
CHECK
LINK
DROP
MOVE
```

[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)

A build seals when the final opcode is HALT and the tape has at least 8 instructions.

Latest sealed build: [#000040](builds/000040/program.asm) — **VERIFIED**.

Finalizer: [0x00000000e91fc5bad977c0cc4ad60557c06886a2](https://etherscan.io/address/0x00000000e91fc5bad977c0cc4ad60557c06886a2) · [Sealing transaction](https://etherscan.io/tx/0xca37d6aad01406be06418279417b7f06824684980c0b8b412e65debb2352717b).

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
