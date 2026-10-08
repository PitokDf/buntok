#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Buntok Framework Performance Benchmarks          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Running benchmarks with mitata..."
echo ""

cd "$(dirname "$0")"

echo "┌──────────────────────────────────────────────────────────┐"
echo "│ 1/4 Router & Query String Parsing                        │"
echo "└──────────────────────────────────────────────────────────┘"
bun run benchmarks/router.bench.ts

echo ""
echo "┌──────────────────────────────────────────────────────────┐"
echo "│ 2/4 Zod Validation (compiled vs raw)                     │"
echo "└──────────────────────────────────────────────────────────┘"
bun run benchmarks/validation.bench.ts

echo ""
echo "┌──────────────────────────────────────────────────────────┐"
echo "│ 3/4 Password Hashing (Bun.password vs legacy)            │"
echo "└──────────────────────────────────────────────────────────┘"
bun run benchmarks/password.bench.ts

echo ""
echo "┌──────────────────────────────────────────────────────────┐"
echo "│ 4/4 Crypto Hashing (Bun.hash vs node:crypto)             │"
echo "└──────────────────────────────────────────────────────────┘"
bun run benchmarks/crypto.bench.ts

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Benchmarks Complete!                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
