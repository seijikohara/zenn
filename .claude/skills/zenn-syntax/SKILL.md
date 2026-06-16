---
name: zenn-syntax
description: "Zenn の記事・本を執筆・編集するときに Zenn 独自の Markdown 記法を正しく使うためのリファレンス。コードブロック（ファイル名・diff）、メッセージ / details ボックス、KaTeX 数式、Mermaid、画像の幅・キャプション、脚注、リンクカード、各種埋め込み（X・YouTube・GitHub・CodePen・Docswell など）を網羅する。記事を書くときや記法に迷ったときに参照する。"
allowed-tools: Read
---

# Zenn 記法

Zenn の記事・本で使う Markdown 記法をまとめる。標準的な Markdown に加え、Zenn 独自の記法を正しく使う。全記法と例は同ディレクトリの `reference.md` を参照する。

## よく使う記法

### コードブロック（ファイル名つき）

言語の後に `:ファイル名` を付ける。

````
```js:src/index.js
console.log("hello");
```
````

### コードブロック（diff）

言語名の前に `diff` を付ける。

````
```diff js
- const a = 1;
+ const a = 2;
```
````

### メッセージ / 警告

```
:::message
補足の本文。
:::

:::message alert
警告の本文。
:::
```

### アコーディオン（details）

```
:::details タイトル
折りたたむ本文。
:::
```

入れ子にする場合は、外側のコロン数を内側より多くする（`::::details` の中に `:::message`）。

### 数式（KaTeX）

```
$$
e^{i\theta} = \cos\theta + i\sin\theta
$$
```

インラインは `$a \ne 0$`。

### Mermaid

````
```mermaid
graph TB
  A --> B
```
````

### 画像（幅・キャプション）

```
![代替テキスト](https://example.com/img.png =400x)
*キャプション*
```

### リンクカード・埋め込み

URL を単独行に置くとカード表示になる。明示する場合は `@[card](URL)`。埋め込みは `@[youtube](ID)`、`@[tweet](URL)`、`@[gist](URL)` などを使う。

## 詳細

脚注・表・全埋め込みサービス・各種制約を含む全記法は `reference.md` を参照する。
