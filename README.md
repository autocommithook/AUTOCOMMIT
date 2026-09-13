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
| Build | #000044 |
| Tape | 6 / 256 instructions |
| Tape hash | `0xebd22819bc6e15ba45ddf9d1891b7e404ab43e3b8b59fd6adc14c81aabed2be2` |
| Authors in this build | [8](live/authors.json) |
| Sealed builds | [43](builds/) |
| Finalized through | [25965628](https://etherscan.io/block/25965628) |
| Contract | [0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc](https://etherscan.io/address/0xec48D60D9078edEa7F37B6Bd309d9F8e2fdf60Cc) |
| Last machine transaction | [0x183b0062…](https://etherscan.io/tx/0x183b00620552a0f8487813374608e18e2d011b477c62ecb252a5cf7fe15df898) |

```asm
OPEN
ADD
PUSH
PUSH
DROP
LINK
```

[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)

A build seals when the final opcode is HALT and the tape has at least 8 instructions.

Latest sealed build: [#000043](builds/000043/program.asm) — **VERIFIED**.

Finalizer: [0x1b82a3d07fc1da1392110509cc47bb38678d7f59](https://etherscan.io/address/0x1b82a3d07fc1da1392110509cc47bb38678d7f59) · [Sealing transaction](https://etherscan.io/tx/0xf942eed5f26f0eafceb12eb65e25e5baa5b0cd6fc24a6c760de13da93efc8516).

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
