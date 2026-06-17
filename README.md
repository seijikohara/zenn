# zenn

<https://zenn.dev/seijikohara> で公開する記事・本を管理するリポジトリ。

[Zenn CLI](https://zenn.dev/zenn/articles/zenn-cli-guide) で執筆し、GitHub 連携で自動デプロイする。

## セットアップ

```bash
npm install
```

## 使い方

```bash
# 記事を新規作成
npx zenn new:article

# ブラウザでプレビュー
npx zenn preview

# 記事の一覧を表示
npx zenn list:articles
```

## 構成

- `articles/` — 記事（`<slug>.md`）
- `books/` — 本

規約の詳細は [AGENTS.md](./AGENTS.md) を参照（Claude Code は CLAUDE.md 経由で取り込む）。

## 執筆支援（Claude Code）

`.claude/` に Claude Code 用の支援を用意する。

- `/new-article` — 規約どおりに新規記事を生成するスキル。
- zenn-syntax — Zenn の全 Markdown 記法リファレンス（執筆時に参照）。
- technical-writer — 記事・本を執筆・編集・修正するテクニカルライター。仕上げに次のレビュー用エージェントを呼び出し、指摘が収束するまで反映する。
- fact-checker — バージョン・API・数値・日付などの事実を一次情報で検証するエージェント。
- zenn-reviewer — frontmatter・config.yaml・記法・プレビューを点検する Zenn 記法のレビュー用エージェント。
- sample-code-verifier — サンプルコードをビルド・実行して検証するエージェント。

## 参考リンク

- [Zenn CLI ガイド](https://zenn.dev/zenn/articles/zenn-cli-guide)
- [GitHub 連携](https://zenn.dev/zenn/articles/connect-to-github)
- [Markdown 記法](https://zenn.dev/zenn/articles/markdown-guide)
