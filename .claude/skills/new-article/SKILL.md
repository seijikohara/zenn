---
name: new-article
description: "Zenn の新しい記事を作成するときに使う。npx zenn new:article で雛形を生成し、frontmatter を補完し、文体規約と Zenn 記法に従って本文を整える。ユーザが「記事を作る」「新規記事」「new article」などと求めたときに実行する。"
argument-hint: "[slug] [title]"
---

# 新規記事の作成

Zenn の新しい記事を、Zenn 運用規約と文体規約に従って作成する。

## 手順

1. メタ情報を決める。
   - slug: `a-z0-9`・`-`・`_` の 12〜50 字。記事内容を表す英小文字。
   - title: 記事タイトル（日本語）。
   - type: `tech`（技術記事）または `idea`（アイデア記事）。
   - emoji: アイキャッチの絵文字 1 文字。
   - topics: 最大 5 個のタグ。

2. 雛形を生成する。

   ```bash
   npx zenn new:article --slug <slug> --title "<title>" --type <type> --emoji <emoji>
   ```

   引数を省略すると、CLI が既定値とランダムな slug で生成する。

3. 生成された `articles/<slug>.md` の frontmatter を整える。`topics` を設定し、`published: false` を保つ。

4. 本文を書く。文体規約（テクニカルライティング・指示代名詞の不使用・日本語）と Zenn 記法に従う。記法は zenn-syntax スキルの `reference.md` を参照する。

5. プレビューで表示を確認する。

   ```bash
   npx zenn preview
   ```

6. 公開する段階で `published: true` に変更し、コミットして連携ブランチへ push する。点検が必要なら technical-writer エージェントにレビューを依頼する。technical-writer は文体を点検し、fact-checker・zenn-reviewer・sample-code-verifier を呼び出して事実・記法・コードを確認する。
