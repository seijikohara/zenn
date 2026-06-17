# CLAUDE.md

@AGENTS.md

## Claude Code 固有

共通の指示は AGENTS.md に従う。Claude Code では加えて次を利用する。

- `.claude/skills/zenn-syntax/` — Zenn の全 Markdown 記法リファレンス。執筆時に参照する。
- `.claude/agents/technical-writer.md` — 記事・本を執筆・編集・修正し、レビュー用エージェントを呼び出して収束まで反映するテクニカルライター。
- `.claude/agents/fact-checker.md` — 事実関係を一次情報で検証するサブエージェント。
- `.claude/agents/zenn-reviewer.md` — Zenn 記法を点検するサブエージェント。
- `.claude/agents/sample-code-verifier.md` — サンプルコードをビルド・実行検証するサブエージェント。
