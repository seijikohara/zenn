---
title: "Rust"
---

本章では、Rust とその周辺ツールを mise で管理する方法を扱います。読了後には、Rust のツールチェーンを `mise.toml` で固定し、Cargo 製の CLI ツールも同じ設定ファイルにまとめて宣言できるようになります。あわせて、mise と rustup の関係を整理し、どちらを主に使うかの指針を示します。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、`mise.toml` の構文は第 4 章、`mise install` / `mise use` / `mise ls` などの操作は第 5 章で扱いました。本章はコマンドの基本操作を再説明せず、Rust 固有の事情に集中します。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## Rust のバージョン管理

mise は Rust を core backend で組み込み対応します[^rust]。core backend は、mise が標準で内蔵するツールの取得方法です。Rust は backend の追加設定なしに、ツール名 `rust` で宣言できます。backend の仕組みの詳細は第 12 章で扱います。

ツール名の `rust` は、Rust のツールチェーン全体を指します。ツールチェーンには、コンパイラの `rustc` と、ビルド・パッケージ管理ツールの `cargo` が含まれます。`rust` を宣言すると、`rustc` と `cargo` の両方が利用できます。

mise は、他言語の core backend と異なり、Rust を rustup を介して管理します[^rust]。rustup は Rust 公式のツールチェーン管理ツールです。mise と rustup の関係は次の節で整理します。

### バージョンの指定方法

`rust` のバージョン指定には、第 4 章で説明した構文を使います。完全指定・部分指定に加えて、`latest` のエイリアスと、Rust のリリースチャンネルを利用できます[^rust]。

```toml:mise.toml
[tools]
rust = "1.96.0"  # 完全指定。1.96.0 に固定
```

部分指定は、先頭の一部だけを書きます。`rust = "1.96"` は、1.96 系の最新バージョン（執筆時点では 1.96.0）に解決されます。`latest` は最新の安定版（stable チャンネル）に解決します。

```toml:mise.toml
[tools]
rust = "1.96"  # 1.96 系の最新に解決
```

Rust は、安定版を 6 週間ごとに公開し、安定版（stable）・ベータ版（beta）・開発版（nightly）の 3 つのリリースチャンネルを持ちます[^rust-channels]。mise はチャンネル名でのバージョン指定に対応します[^rust]。`rust = "beta"` は最新のベータ版に解決します。

```toml:mise.toml
[tools]
rust = "beta"  # 最新のベータ版に解決
```

:::message
`latest`・部分指定・チャンネル指定は、インストール時点での最新版に解決します。インストール後はバージョンが固定され、自動では更新されません。再現性が必要なプロジェクトでは、完全指定でバージョンを固定します。
:::

### インストールと確認

`mise use` でバージョンを宣言し、インストールします。次の例は、プロジェクトのディレクトリで Rust 1.96.0 を宣言します。

```shell
$ mise use rust@1.96.0
mise rust@1.96.0  ✓ installed
mise ~/work/my-app/mise.toml tools: rust@1.96.0
```

インストール後、`rustc --version` でコンパイラのバージョンを確認します。

```shell
$ rustc --version
rustc 1.96.0 (6b00bc388 2026-05-28)
```

ツールチェーンには cargo も含まれます。`cargo --version` で cargo のバージョンを確認します。Rust と cargo は同じツールチェーンに同梱され、バージョン番号が対応します。

```shell
$ cargo --version
cargo 1.96.0 (a1c4f4e2e 2026-05-12)
```

### rust-toolchain.toml を読み込む

mise は、Rust 向けのツールチェーン定義ファイルである `rust-toolchain.toml` を読み込めます[^rust-toolchain]。`rust-toolchain.toml` は、rustup がツールチェーンの選択に使う設定ファイルです[^rustup-overrides]。mise は、asdf のレガシーバージョンファイルにならって、`rust-toolchain.toml` を idiomatic version files と呼びます[^idiomatic]。mise が読み込むのは `rust-toolchain.toml` です。拡張子の無い `rust-toolchain` は読み込みの対象外です[^rust-toolchain]。

`rust-toolchain.toml` では、`[toolchain]` テーブルの `channel` キーにバージョンまたはチャンネルを書きます[^rustup-overrides]。

```toml:rust-toolchain.toml
[toolchain]
channel = "1.96.0"
```

ただし、idiomatic version files の読み込みは既定で無効です[^idiomatic]。`rust-toolchain.toml` を置いただけでは、mise は Rust のバージョンを解決しません。読み込みを有効にするには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools rust
```

設定を追加すると、mise は `rust-toolchain.toml` の `channel` を Rust のバージョンとして解決します。次の例は、`channel = "1.96.0"` を記述した `rust-toolchain.toml` を読み込んだ結果です。`Source` 列が `rust-toolchain.toml` を指します。

```shell
$ mise ls rust
Tool  Version   Source                              Requested
rust  1.96.0    ~/work/my-app/rust-toolchain.toml   1.96.0
```

:::message
idiomatic version files が既定で無効になったのは、mise 2025.10.0 からです[^idiomatic-default]。それ以前のバージョンでは既定で有効でした。新規のプロジェクトでは `mise.toml` を使い、`rust-toolchain.toml` は rustup との併用や互換性の維持に用います。
:::

## mise と rustup の関係

mise は Rust を rustup を介して管理します[^rust]。rustup は Rust 公式のツールチェーン管理ツールで、複数バージョンのツールチェーンを導入し、切り替えます[^rustup]。mise は rustup を内部で呼び出し、要求したバージョンのツールチェーンを rustup に導入させます。

### mise が rustup を扱う仕組み

mise は、`rust` を初めて宣言したときに rustup が無ければ、rustup をインストールします[^rust]。インストール後、mise は環境変数 `RUSTUP_TOOLCHAIN` に要求したバージョンを設定し、rustup にバージョンを伝えます[^rust]。`RUSTUP_TOOLCHAIN` は、rustup が使うツールチェーンを指定する環境変数です[^rustup-overrides]。

Rust のツールチェーンの実体は、`~/.local/share/mise/installs` には置かれません[^rust]。他言語の core backend は、取得したツールを mise のインストールディレクトリに展開します。Rust は rustup が管理するため、実体は rustup のディレクトリに置かれます。mise は既定で、rustup のホームディレクトリを `~/.rustup`、cargo のホームディレクトリを `~/.cargo` として扱います[^rust]。どちらも環境変数 `RUSTUP_HOME`・`CARGO_HOME` を尊重し、設定があればその値を使います[^rust]。

mise の rustup と cargo を、既存の rustup・cargo から分離する設定もあります。`MISE_RUSTUP_HOME`・`MISE_CARGO_HOME` を設定すると、mise は分離したディレクトリを使います[^rust]。既存の rustup でツールチェーンを導入済みの環境で、mise の管理を切り離したい場合に利用します。

```shell
$ rustc --version
rustc 1.96.0 (6b00bc388 2026-05-28)
$ rustup show active-toolchain
1.96.0-x86_64-apple-darwin (overridden by environment variable RUSTUP_TOOLCHAIN)
```

`rustup show active-toolchain` は、有効なツールチェーンと選択の理由を出力します。前掲の例は、mise が設定した `RUSTUP_TOOLCHAIN` によってツールチェーンが選ばれたことを示します。末尾の `x86_64-apple-darwin` は、実行環境の CPU アーキテクチャと OS を表します。Apple Silicon の Mac では `aarch64-apple-darwin` のように、実行環境に応じて変わります。

### ツールチェーンのオプション

mise は、ツールチェーンの導入時にオプションを指定できます[^rust]。オプションは `[tools]` でテーブル形式の宣言に書きます。`profile` で導入するコンポーネントの範囲を、`components` で追加コンポーネントを、`targets` でクロスコンパイル用のターゲットを指定します[^rust]。

```toml:mise.toml
[tools]
rust = { version = "1.96.0", profile = "minimal", components = "rust-src,clippy" }
```

`profile` は、`minimal`・`default`・`complete` のいずれかを取ります[^rust]。`minimal` は `rustc`・`rust-std`・`cargo` だけを導入します。`default` は `minimal` に `rust-docs`・`rustfmt`・`clippy` を加えます。`profile` を省略すると、rustup の既定プロファイルに従います[^rust]。`components` は、プロファイルに含まれないコンポーネントをカンマ区切りで追加します。前掲の例は、`minimal` プロファイルに `rust-src` と `clippy` を追加します。

### mise と rustup の選択指針

mise と rustup は、どちらも Rust のツールチェーンを管理します。mise は rustup を内部で使うため、両者は排他ではありません。選択の指針を次に示します。

- 複数言語のバージョンを `mise.toml` で一元管理する場合は、Rust も mise で宣言します。mise が rustup を介してツールチェーンを固定し、Node.js や Python と同じ設定ファイルにまとめられます。
- Rust 単体のプロジェクトで、rustup の機能を直接使う場合は、rustup を主に使います。rustup の `override` や `rust-toolchain.toml` でツールチェーンを管理し、mise では Rust 以外のツールを宣言します。

:::message
mise で `rust` を宣言する場合と、rustup で直接ツールチェーンを管理する場合は、どちらも rustup が実体を管理します。mise は `RUSTUP_TOOLCHAIN` でバージョンを指定し、rustup の `rust-toolchain.toml` や `override` より優先されます[^rustup-overrides]。両方で別々のバージョンを指定すると、mise の指定が優先されます。指定をそろえるか、管理をどちらか一方に統一します。
:::

## cargo backend による Cargo 製ツールの導入

Rust 製の CLI ツールは、crates.io などのレジストリから `cargo install` でインストールできます[^cargo-install]。crates.io は Rust の公式パッケージレジストリです。mise は、`cargo install` 相当の取得を担う cargo backend を備えます[^cargo-backend]。cargo backend は、ツール名の接頭辞に `cargo:` を付け、続けてクレート名を書く記法で宣言します[^cargo-backend]。

```toml:mise.toml
[tools]
rust = "1.96.0"
"cargo:ripgrep" = "latest"  # cargo backend で ripgrep を導入
```

ツール名としての core backend の `rust`（Rust 本体）と、backend としての `cargo:`（Cargo 製ツールの導入）は別物です。`rust` は Rust のツールチェーンを導入します。`cargo:<クレート名>` は、指定したクレートを `cargo install` でビルドし、実行ファイルを導入します。

cargo backend は、cargo が利用できることを前提とします[^cargo-backend]。前掲の例のように `[tools]` で `rust` を宣言すると、mise が用意した cargo を使ってツールをビルドできます。インストール後の確認は、ツールごとのコマンドで行います。次の例は、検索ツールの ripgrep[^ripgrep] を確認します。ripgrep は `rg` コマンドを提供します。

```shell
$ mise use rust@1.96.0 "cargo:ripgrep@latest"
mise rust@1.96.0           ✓ installed
mise cargo:ripgrep@15.1.0  ✓ installed
$ rg --version
ripgrep 15.1.0
```

`latest` で宣言した ripgrep は、執筆時点では crates.io の 15.1.0 に解決します。cargo backend は、`mise install` の出力でクレート名と解決後のバージョンを表示します。`mise use` は `mise.toml` にツールを書き込むとき、キーをアルファベット順に並べ替えます。`cargo:ripgrep` は `rust` より前に並びます。

:::message
ツール名の `ripgrep` は、cargo backend 専用ではありません。mise の registry では、`ripgrep` は複数の backend に対応し、既定ではプリビルドバイナリを配布する aqua backend を優先します[^registry]。cargo backend でソースからビルドして導入するには、`cargo:ripgrep` と接頭辞を明示します。registry の仕組みと backend の使い分けは第 12 章で扱います。
:::

### cargo backend のオプション

cargo backend では、`cargo install` に渡すオプションを指定できます[^cargo-backend]。オプションは `[tools]` でテーブル形式の宣言に書きます。`features` でクレートの機能（feature）を、`default-features` で既定機能の有効・無効を指定します[^cargo-backend]。次の例は、`cargo-edit` を `add` feature つきで導入します。

```toml:mise.toml
[tools]
"cargo:cargo-edit" = { version = "latest", features = "add" }
```

Git リポジトリからの導入も指定できます[^cargo-backend]。`mise.toml` では、`cargo:` の後にクレート名の代わりに Git リポジトリの URL をキーに書きます。`version` の値に `tag:`・`branch:`・`rev:` の接頭辞を付けて対象を指定します。それぞれタグ・ブランチ・コミットを指します。

```toml:mise.toml
[tools]
"cargo:https://github.com/username/demo" = { version = "tag:v1.0.0" }  # タグ v1.0.0 を導入
```

:::message
mise は、cargo-binstall が利用できる場合、`cargo install` の代わりに cargo-binstall でプリビルドバイナリを取得します[^cargo-backend]。cargo-binstall は、ビルド済みのバイナリを取得して導入を高速化するツールです。`features` や `default-features` を指定したツールは、ソースからのビルドが必要なため、cargo-binstall を使いません。挙動は `cargo.binstall` 設定で制御します。backend の全体像は第 12 章で扱います。
:::

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、Rust プロジェクトの `mise.toml` の例を示します。Rust のツールチェーンを固定し、Rust 製ツールの ripgrep を cargo backend で宣言します。

```toml:mise.toml
[tools]
rust = "1.96.0"            # Rust のツールチェーンを固定
"cargo:ripgrep" = "latest"  # 検索ツールを cargo backend で導入
```

設定後、`mise install` でツールをまとめてインストールします。インストール後、Rust 本体とツールのバージョンを確認します。

```shell
$ mise install
mise rust@1.96.0           ✓ installed
mise cargo:ripgrep@15.1.0  ✓ installed
$ rustc --version
rustc 1.96.0 (6b00bc388 2026-05-28)
$ cargo --version
cargo 1.96.0 (a1c4f4e2e 2026-05-12)
$ rg --version
ripgrep 15.1.0
```

`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じバージョンの Rust と ripgrep を使えます。Rust のツールチェーンの実体は rustup が管理するため、`~/.cargo` と `~/.rustup` は mise のインストールディレクトリの外に残ります。

## 本章のまとめ

- mise は Rust を core backend で組み込み対応します。ツール名 `rust` で Rust のツールチェーン（`rustc` と `cargo`）を宣言し、完全指定・部分指定・`latest`・チャンネル名でバージョンを指定します。
- mise は Rust を rustup を介して管理します。rustup が無ければ mise が rustup をインストールし、`RUSTUP_TOOLCHAIN` でバージョンを伝えます。ツールチェーンの実体は rustup が `~/.rustup`・`~/.cargo` で管理し、`~/.local/share/mise/installs` には置きません。
- mise は `rust-toolchain.toml` を読み込めますが、mise 2025.10.0 以降は既定で無効です。`idiomatic_version_file_enable_tools` にツール名を追加して有効にします。拡張子の無い `rust-toolchain` は対象外です。
- 複数言語を `mise.toml` で一元管理する場合は Rust も mise で宣言し、rustup の機能を直接使う場合は rustup を主に使います。両方で別々のバージョンを指定すると mise の指定が優先されます。
- Rust 製の CLI ツールは cargo backend（`cargo:<クレート名>`）で導入します。core backend の `rust`（Rust 本体）と cargo backend の `cargo:`（Cargo 製ツールの導入）は別物です。`features` などのオプションや Git リポジトリからの導入も指定できます。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^rust]: mise での Rust の管理を扱う。core backend での組み込み対応、rustup を介した管理、`RUSTUP_TOOLCHAIN` の設定、`~/.rustup` と `~/.cargo` の扱いを含む。バージョンやチャンネルの指定、`MISE_RUSTUP_HOME`・`MISE_CARGO_HOME` による分離、`profile`・`components`・`targets` のオプションも対象とする。mise 公式ドキュメント「Rust」<https://mise.jdx.dev/lang/rust.html>
[^rust-channels]: Rust のリリースチャンネル（stable・beta・nightly）と 6 週間ごとのリリースサイクル。Rust 公式ドキュメント「Appendix G: How Rust is Made and "Nightly Rust"」<https://doc.rust-lang.org/book/appendix-07-nightly-rust.html>
[^rust-toolchain]: mise が idiomatic version files として読み込む `rust-toolchain.toml`。読み込みは `mise.jdx.dev/lang/rust.html` には明記されないが、mise 本体の Rust プラグイン実装が `rust-toolchain.toml` を対象とする。mise 公式リポジトリ「src/plugins/core/rust.rs」<https://github.com/jdx/mise/blob/main/src/plugins/core/rust.rs>
[^rustup-overrides]: rustup のツールチェーン選択順（`RUSTUP_TOOLCHAIN` 環境変数・`rust-toolchain.toml`・`override`）と `[toolchain]` テーブルの `channel` キー。Rust 公式「The rustup book — Overrides」<https://rust-lang.github.io/rustup/overrides.html>
[^idiomatic]: mise が読み込む idiomatic version files（`rust-toolchain.toml` など）と、既定で無効である点、`idiomatic_version_file_enable_tools` 設定。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic-default]: idiomatic version files の既定が無効に変わった経緯（mise 2025.10.0）。mise 公式リポジトリの Discussion「Disabling idiomatic version files by default」<https://github.com/jdx/mise/discussions/4345>
[^rustup]: rustup は Rust 公式のツールチェーン管理ツールで、複数バージョンのツールチェーンを導入・切り替えする。Rust 公式「The rustup book」<https://rust-lang.github.io/rustup/>
[^cargo-install]: `cargo install` は Rust 製のバイナリクレートをビルドして導入する。Rust 公式ドキュメント「cargo install」<https://doc.rust-lang.org/cargo/commands/cargo-install.html>
[^cargo-backend]: cargo backend の記法と挙動を扱う。`cargo:<クレート名>` での宣言、`cargo install` 相当の取得、cargo が利用できる前提を含む。`features`・`default-features`・`bin` のオプション、Git リポジトリからの導入、cargo-binstall 連携と `cargo.binstall` 設定も対象とする。mise 公式ドキュメント「Cargo Backend」<https://mise.jdx.dev/dev-tools/backends/cargo.html>
[^ripgrep]: ripgrep は gitignore を尊重しつつディレクトリを再帰的に正規表現で検索します。`rg` コマンドを提供します。BurntSushi「ripgrep」<https://github.com/BurntSushi/ripgrep>
[^registry]: mise registry でのツール名と backend の対応（`ripgrep` は aqua・asdf・cargo に対応し、aqua を優先する）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
