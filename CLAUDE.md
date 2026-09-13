@AGENTS.md

## graphify

If `graphify-out/graph.json` exists, answer architecture/codebase questions from
the graph before broad file reads:

```bash
graphify query "<question>"
```

After changing code in this repo:

```bash
graphify update .
```

If the report or visualization also needs a refresh: `graphify cluster-only . --no-label`.
