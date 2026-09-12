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
| Build | #000028 |
| Tape | 26 / 256 instructions |
| Tape hash | `0x1b6ad39e844459ac4ab34be0f640eb0ee4ac4ccf12d0c80ffb21c597315766c6` |
| Authors in this build | [9](live/authors.json) |
| Sealed builds | [27](builds/) |
| Finalized through | [25959373](https://etherscan.io/block/25959373) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0x155b8556…](https://etherscan.io/tx/0x155b8556e35f89302d36431f5da96d678c5a559498c362c95e10988aa2f580a4) |

```asm
BREAK
BREAK
CHECK
LINK
XOR
BREAK
LOCK
CHECK
MOVE
DROP
OPEN
MOVE
LOCK
LINK
COPY
JUMP
CHECK
CHECK
ADD
LINK
PUSH
ADD
OPEN
LOCK
JUMP
CHECK
```

[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)

A build seals when the final opcode is HALT and the tape has at least 8 instructions.

Latest sealed build: [#000027](builds/000027/program.asm) — **VERIFIED**.

Finalizer: [0x00000000e91fc5bad977c0cc4ad60557c06886a2](https://etherscan.io/address/0x00000000e91fc5bad977c0cc4ad60557c06886a2) · [Sealing transaction](https://etherscan.io/tx/0x20bbd2fbb8706d4faf2ffc897bde9a890054d74d68b2e91098267d4ba6990316).

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
