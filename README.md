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
- zenn-reviewer — frontmatter・文体・記法を点検するレビュー用エージェント。

## 参考リンク

- [Zenn CLI ガイド](https://zenn.dev/zenn/articles/zenn-cli-guide)
- [GitHub 連携](https://zenn.dev/zenn/articles/connect-to-github)
- [Markdown 記法](https://zenn.dev/zenn/articles/markdown-guide)
