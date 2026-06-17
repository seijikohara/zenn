# AGENTS.md

<https://zenn.dev/seijikohara> で公開する Zenn コンテンツ用リポジトリの、AI コーディングエージェント向け共通指示。

## 目的

リポジトリは、Zenn CLI（`zenn-cli`）で執筆する記事・本を管理する。Zenn の GitHub 連携により、連携ブランチへ push すると自動でデプロイされ、<https://zenn.dev/seijikohara> に公開される。

## 構成

- `articles/` — 記事 1 本につき Markdown ファイル 1 つ（`<slug>.md`）。
- `books/` — 本のコンテンツ（1 冊につき 1 ディレクトリ）。
- `.claude/` — Claude Code 用のスキルとエージェント。
- `package.json` / `package-lock.json` — 依存とスクリプトを管理する。
- `node_modules/`、`.DS_Store` — Git 管理対象外。

## 言語と文体

- すべての成果物（記事・本・README・コミットメッセージ・PR）を日本語で書く。
- コミットメッセージは Conventional Commits 形式に従う。type（`feat` / `fix` / `chore` など）は英語のまま、説明文を日本語で書く。
- 技術用語とコード識別子は原語のまま記す。
- テクニカルライティングを徹底する。
  - 1 文 1 意とし、不要な修飾語と冗長表現を排除する。
  - 能動態・現在形を基本とし、主語を明示する。
  - 略語は初出時に定義する。
  - 用語を統一する。同一概念を複数の語で書き分けない。
- 指示代名詞（これ・それ・あれ・この・その・あの・ここ・そこ・こちら・そちら 等）を使わず、具体的な名詞で書く。
- 段落内でハードブレイク（手動改行）を使わない。1 段落を 1 行で書き、段落の区切りに空行を使う。コードブロック・表・frontmatter は対象外。

## Zenn 運用規約

### 記事の frontmatter

```yaml
---
title: ""        # 必須
emoji: "😶"      # 必須、1 文字だけ（アイキャッチ）
type: "tech"     # 必須: "tech"（技術記事）または "idea"（アイデア記事）
topics: []       # 最大 5 個のタグ。例: ["typescript", "aws"]
published: false # true = 公開、false = 下書き
published_at:    # 任意、"YYYY-MM-DD" または "YYYY-MM-DD hh:mm"（JST）。予約投稿・バックデート用。設定は慎重に行う。
---
```

### slug の規則

- ファイル名は `<slug>.md`。
- slug は `a-z0-9`・ハイフン `-`・アンダースコア `_` の 12〜50 字。

### 執筆フロー

1. `npx zenn new:article` で記事を作成する（CLI が既定の frontmatter と有効な slug を生成する）。
2. frontmatter を設定し、`published: false` のまま本文を書く。
3. `npx zenn preview` でブラウザ表示を確認する。
4. 完成後に `published: true` へ変更し、コミットして連携ブランチへ push する。

執筆・編集・修正と仕上げのレビューは technical-writer エージェントに委譲する。technical-writer は fact-checker・zenn-reviewer・sample-code-verifier を呼び出し、指摘が収束するまで反映する。既存の記事・本の編集も同じく technical-writer を使う。

### 注意点

- 公開済みの記事を取り下げる場合は、GitHub のファイル削除ではなく Zenn ダッシュボードから削除する。GitHub 上の削除だけでは非公開にならない。
- 完成まで `published: false` を保つ。下書きはリポジトリに置いたままで問題ない。
- `emoji` は必ず 1 文字。不正な frontmatter はデプロイ時にエラーとなる。

### 本（books）

- 本は `npx zenn new:book` で雛形を作成し、Zenn の本の構成（`config.yaml` と章の Markdown）に従う。詳細は Zenn CLI ガイドを参照する。
- technical-writer・fact-checker・zenn-reviewer・sample-code-verifier の各エージェントは記事と本の両方で使える。本の執筆でも言語と文体の規約を適用する。

## コマンドと検証

- `npm run lint` — textlint で Markdown を検証する。除外は `.textlintignore` で管理し、`reference.md`（記法の早見表）は対象外。
- `npm run lint:fix` — 自動修正できる指摘を修正する。
- `npx zenn new:article` / `npx zenn preview` / `npx zenn list:articles` — 記事の作成・プレビュー・一覧表示。
- commit 時は lefthook の pre-commit（`lefthook.yml`）が staged の Markdown を textlint で検証し、エラーがあれば commit を中断する。`.textlintignore` の除外は `npm run lint` と pre-commit のどちらでも有効。

### textlint の方針

- ルールは `preset-ja-technical-writing` を `.textlintrc.json` で調整する。設定ファイルを唯一の正とする。
- 自動で強制（エラー）する主な制約は次のとおり。
  - 一文は 120 字以内。
  - 読点とコンマは各 3 個以内。
  - 文末は「。」で終える。
  - 半角カナを使わない。
  - 冗長表現・誤用・二重否定・ら抜き言葉を検出する。
- である調・ですます調は混在のみを検査し、特定の調子は強制しない。管理文書は である調 で書く。記事の調子は記事ごとに選ぶ。
- `no-doubled-joshi`（同一助詞の連続）は warning とし、commit を止めない。
- 「能動態・現在形」などの文体方針は textlint で強制しない。必要に応じて technical-writer が確認する。

## 参考

- Zenn CLI ガイド: <https://zenn.dev/zenn/articles/zenn-cli-guide>
- GitHub 連携: <https://zenn.dev/zenn/articles/connect-to-github>
- Markdown 記法: <https://zenn.dev/zenn/articles/markdown-guide>
