---
title: "言語以外の CLI ツール"
---

本章では、言語ランタイム以外の CLI ツールを mise で管理する方法を扱います。読了後には、Terraform や kubectl のようなツールを `mise.toml` に宣言し、言語と同じ設定ファイルで一元管理できるようになります。あわせて、第 6 章から第 11 章で各言語章が「第 12 章で扱う」と繰り返し触れた backend の全体像を整理し、任意のツールをどの backend で導入するかを判断できるようにします。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、`mise.toml` の構文は第 4 章、`mise install` / `mise use` / `mise ls` などの操作は第 5 章で扱いました。本章はコマンドの基本操作を再説明せず、backend の体系と CLI ツールの導入に集中します。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## backend とは何か

backend は、mise がツールを取得する方式です[^backend-arch]。第 6 章から第 11 章で扱った言語ランタイムは、いずれも mise 本体に組み込まれた core backend で取得しました。Go 製ツールの go backend（`go:`）、Cargo 製ツールの cargo backend（`cargo:`）、Python ツールの pipx backend（`pipx:`）も backend の一種です。mise は、言語固有の backend に加えて、任意の CLI ツールを取得する汎用の backend を備えます。

各 backend は、取得元と取得方法が異なります。core backend は mise に組み込まれた言語ランタイムを取得します。後述の aqua backend は aqua レジストリの定義に従ってプリビルドバイナリ（ビルド済みの実行ファイル）を取得し、github backend は GitHub Releases からバイナリを取得します。ツールごとに、どの backend が利用できるかは決まっています。利用できる backend は、次節の registry で確認します。

## registry でツール名と backend を確認する

registry は、mise が認識するツールの短縮名と、各ツールの backend の対応表です[^registry]。registry に登録されたツールは、backend の接頭辞を付けず、短縮名だけで宣言できます。mise は registry の定義に従って既定の backend を選びます。例えば `terraform` という短縮名は、aqua backend の `aqua:hashicorp/terraform` に対応します。

### `mise registry` で一覧を見る

`mise registry` は、registry に登録された全ツールの短縮名と、対応する backend を一覧表示します[^cli-registry]。各行は、左に短縮名、右に backend 識別子を表示します。1 つのツールに複数の backend が登録されている場合は、空白区切りですべての backend を並べ、先頭が既定の backend です[^backend-arch]。先頭の数行を次に示します。

```shell
$ mise registry
1password           vfox:mise-plugins/vfox-1password aqua:1password/cli
act                 aqua:nektos/act asdf:gr1m0h/asdf-act
actionlint          aqua:rhysd/actionlint asdf:crazy-matt/asdf-actionlint go:github.com/rhysd/actionlint/cmd/actionlint
...
```

`act` という短縮名は、先頭の `aqua:nektos/act` を既定の backend とし、`asdf:gr1m0h/asdf-act` も候補に持ちます。`1password` は vfox backend を既定とします。一覧は長いため、`grep` で目的のツールに絞り込めます。

### `mise registry <ツール>` で特定ツールを見る

`mise registry` にツール名を渡すと、対象ツールの backend 識別子だけを表示します[^cli-registry]。次の例は、`terraform` の backend を確認します。

```shell
$ mise registry terraform
aqua:hashicorp/terraform asdf:mise-plugins/mise-hashicorp vfox:mise-plugins/vfox-terraform
```

出力は、`terraform` に登録された backend を空白区切りで並べます。先頭の `aqua:hashicorp/terraform` が既定の backend で、`terraform` を宣言すると aqua backend で取得することを表します。各 backend が対応する OS の一覧は、mise 公式ドキュメントの registry ページで確認できます[^registry]。

:::message
registry に複数の backend が登録されたツールは、定義順の先頭が既定になります[^backend-arch]。`mise registry <ツール>` の出力の先頭が、ツール名だけで宣言したときに使われる backend です。別の backend を使う場合は、後述の接頭辞付きの記法で明示します。
:::

## backend の全体像と選択指針

mise は複数の backend を備えます。CLI ツールの導入で中心になるのは、core・aqua・github・ubi・asdf・vfox の 6 つです。各 backend の概要と記法を次の表にまとめます。記法の列は、`mise.toml` でツールを宣言するときの接頭辞を示します。

| backend | 概要 | 記法 |
| --- | --- | --- |
| core | mise に組み込まれた言語ランタイム | 接頭辞なし（`node` など） |
| aqua | aqua レジストリ経由でプリビルドバイナリを取得 | `aqua:<org>/<repo>` |
| github | GitHub Releases からバイナリを取得 | `github:<owner>/<repo>` |
| ubi | GitHub・GitLab の Releases からバイナリを取得（非推奨） | `ubi:<owner>/<repo>` |
| asdf | asdf プラグイン経由で取得 | `asdf:<プラグイン>` |
| vfox | vfox プラグイン経由で取得 | `vfox:<プラグイン>` |

### 各 backend の特性

core backend は、mise 本体に Rust で組み込まれた言語ランタイムを取得します[^core]。Node.js・Python・Go・Ruby・Java などが対象です。プラグインの追加なしに、ツール名だけで宣言できます。第 6 章から第 11 章で扱った言語は、すべて core backend です。

aqua backend は、aqua レジストリの定義に従ってプリビルドバイナリを取得します[^aqua]。aqua は、ツールの配布元とチェックサムを定義したレジストリを持つパッケージマネージャです。mise は aqua のレジストリ定義を本体に同梱し、aqua コマンド本体を必要とせずにツールを取得します[^aqua]。aqua backend は、チェックサム検証に加えて、Cosign による署名検証と SLSA Provenance 検証に対応します[^aqua]。検証に必要な処理は mise が内部で実行するため、`cosign` や `slsa-verifier` のコマンドを別途用意する必要はありません[^aqua]。

github backend は、GitHub Releases に添付されたバイナリを直接取得します[^github]。レジストリへの登録を必要とせず、`github:<owner>/<repo>` の形式でリポジトリを指定して導入できます[^github]。インストールスクリプトを実行せず、Releases のアセットを展開するだけのため、任意のコード実行を伴いません。

ubi backend は、github backend と同じく GitHub・GitLab の Releases からバイナリを取得します[^ubi]。ただし mise 公式ドキュメントは、ubi backend を非推奨とし、github backend への移行を案内します[^ubi]。新規のツールには github backend を使います。

asdf backend は、asdf プラグインを介してツールを取得します[^asdf]。asdf プラグインは Bash で書かれたスクリプトで、インストール処理でスクリプトを実行します。任意のコード実行を伴うため、供給網（サプライチェーン）の観点では aqua・github より検証の範囲が限られます。mise 公式ドキュメントは、asdf backend を legacy（旧来方式）と位置付け、新規の asdf プラグインを registry に受け入れない方針を示します[^asdf]。ソースからのコンパイルや、`JAVA_HOME` などの環境変数の設定が必要なツールに限って利用します[^backend-arch]。

vfox backend は、vfox プラグインを介してツールを取得します[^vfox]。vfox プラグインは Lua で書かれ、mise が内蔵するインタプリタで実行します。vfox backend は Windows を含む複数の OS に対応します[^vfox]。

### backend の選択指針

mise 公式ドキュメントは、backend の使い分けの指針を示します[^backend-arch]。要点を次にまとめます。

- プリビルドバイナリを配布するツールには、aqua backend を優先します。チェックサムと署名の検証に対応し、セキュリティの観点で利点があります[^backend-arch]。
- registry に無いツールや、GitHub Releases で配布されるツールには、github backend を使います。レジストリへの登録を必要とせず、リポジトリを指定して導入できます[^backend-arch]。
- ソースからのコンパイルや、環境変数の設定が必要なツールには、asdf backend または vfox backend を使います[^backend-arch]。
- ubi backend は非推奨です。github backend に置き換えます[^ubi]。

registry に登録されたツールは、短縮名だけで宣言すれば、mise が上記の指針に沿った既定の backend を選びます。多くの CLI ツールは registry に登録済みのため、まず短縮名での宣言を試し、別の backend が必要な場合に接頭辞で明示します。

### backend を明示する記法

backend を明示するには、ツール名の前に backend の接頭辞を付けます。記法の一般形は `<backend>:<ツール識別子>` です[^backend-arch]。次の例は、`terraform` を aqua backend で明示的に宣言します。registry の既定が aqua backend のため、ツール名だけの宣言と同じ結果になります。

```toml:mise.toml
[tools]
"aqua:hashicorp/terraform" = "latest"  # aqua backend を明示
```

`mise use` でも接頭辞を指定できます。次の例は、ripgrep を github backend で導入します。registry の既定（aqua backend）と異なる backend を使う場合に、接頭辞で明示します。

```shell
$ mise use github:BurntSushi/ripgrep@latest
```

:::message
ツール名だけで宣言すると、mise が registry の既定 backend を選びます。接頭辞を付けると、指定した backend が registry の既定より優先されます[^backend-arch]。同じツールを別の backend で導入し分ける場合や、registry に無いツールを導入する場合に、接頭辞で明示します。
:::

## 代表的な CLI ツールの導入例

言語以外の CLI ツールの導入を、Terraform・kubectl・aws-cli の 3 つで示します。いずれも registry に登録され、既定の backend は aqua backend です。3 つとも、ツール名だけで宣言できます。

### Terraform

Terraform[^terraform] は、インフラの構成をコードで定義し、適用するツールです。registry の `terraform` は、aqua backend の `aqua:hashicorp/terraform` に対応します。`mise use` でバージョンを宣言し、インストールします。

```shell
$ mise use terraform@1.15.6
mise terraform@1.15.6  ✓ installed
mise ~/work/infra/mise.toml tools: terraform@1.15.6
```

インストール後、`terraform version` で有効なバージョンを確認します。

```shell
$ terraform version
Terraform v1.15.6
on darwin_amd64
```

出力の 2 行目 `on darwin_amd64` は、実行環境の OS と CPU アーキテクチャを表します。Apple Silicon の Mac では `on darwin_arm64` のように、実行環境に応じて変わります。`latest` で宣言した場合、執筆時点では 1.15.6 に解決します。

### kubectl

kubectl[^kubectl] は、Kubernetes クラスタを操作するコマンドラインツールです。registry の `kubectl` は、aqua backend の `aqua:kubernetes/kubernetes/kubectl` に対応します。`mise use` でバージョンを宣言します。

```shell
$ mise use kubectl@1.36.2
mise kubectl@1.36.2  ✓ installed
mise ~/work/infra/mise.toml tools: kubectl@1.36.2
```

インストール後、`kubectl version --client` でクライアントのバージョンを確認します。`--client` は、クラスタへ接続せずにクライアントのバージョンだけを表示するオプションです。

```shell
$ kubectl version --client
Client Version: v1.36.2
Kustomize Version: v5.8.1
```

`Client Version` が、mise で導入した kubectl のバージョンです。`latest` で宣言した場合、執筆時点では 1.36.2 に解決します。`Kustomize Version` は、kubectl に同梱される Kustomize のバージョンで、kubectl のバージョンに対応します。

### aws-cli

aws-cli[^aws-cli] は、AWS を操作するコマンドラインツールです。aws-cli は、公式がインストーラや OS パッケージで配布し、単純な単一バイナリの形式では配布しません。mise の registry は、aws-cli を aqua backend の `aqua:aws/aws-cli` として登録し、配布物から実行ファイルを取り出して導入します。registry での短縮名は `aws-cli` です。`aws` と `awscli` は `aws-cli` のエイリアスとして登録され、どちらの名前でも宣言できます[^registry]。

```shell
$ mise use aws-cli@2.35.6
mise aws-cli@2.35.6  ✓ installed
mise ~/work/infra/mise.toml tools: aws-cli@2.35.6
```

インストール後、`aws --version` で有効なバージョンを確認します。aws-cli は `aws` コマンドを提供します。

```shell
$ aws --version
aws-cli/2.35.6 Python/3.14.5 Darwin/24.6.0 exe/x86_64
```

出力の `aws-cli/2.35.6` が、mise で導入した aws-cli のバージョンです。`latest` で宣言した場合、執筆時点では 2.35.6 に解決します。後続の `Python/3.14.5` や `Darwin/24.6.0` は、aws-cli が同梱する Python のバージョンと、実行環境の OS を表します。末尾の `exe/x86_64` は、配布形態と CPU アーキテクチャを表します。

:::message
aws-cli の registry エントリは、対応 OS を Linux と macOS に限定します[^registry]。Windows は対象外です。本書は macOS を対象とするため、aws-cli を mise で導入できます。対応 OS の制約は、mise 公式ドキュメントの registry ページで確認できます[^registry]。
:::

## 言語と CLI ツールを同居させた mise.toml の実例

本章で扱った CLI ツールと、第 6 章・第 7 章で扱った言語を、1 つの `mise.toml` に同居させた例を示します。次の例は、アプリケーションの実行に Node.js と Python を、インフラの操作に Terraform と kubectl を宣言します。言語ランタイムは core backend、Terraform と kubectl は aqua backend で取得します。backend は短縮名から自動で選ばれるため、`mise.toml` に backend の接頭辞は現れません。

```toml:mise.toml
[tools]
node = "24.10.0"        # core backend（言語ランタイム）
python = "3.13.7"       # core backend（言語ランタイム）
terraform = "1.15.6"    # aqua backend（registry の既定）
kubectl = "1.36.2"      # aqua backend（registry の既定）
```

設定後、`mise install` でツールをまとめてインストールします。インストール後、各ツールのバージョンを確認します。

```shell
$ mise install
mise node@24.10.0      ✓ installed
mise python@3.13.7     ✓ installed
mise terraform@1.15.6  ✓ installed
mise kubectl@1.36.2    ✓ installed
$ node --version
v24.10.0
$ python --version
Python 3.13.7
$ terraform version
Terraform v1.15.6
on darwin_amd64
$ kubectl version --client
Client Version: v1.36.2
Kustomize Version: v5.8.1
```

`mise install` は、宣言した全ツールを backend ごとに取得します。core backend の言語ランタイムと、aqua backend の CLI ツールが、同じコマンドでまとめて導入されます。`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じバージョンの言語ランタイムと CLI ツールを再現できます。言語とツールのバージョンを 1 つの設定ファイルで管理できるため、開発環境とインフラ操作のツールを別々の手順で導入する必要がなくなります。

:::message
1 つの `mise.toml` に複数の backend のツールを宣言しても、宣言の書き方は変わりません。ツール名だけで宣言したツールは、mise が registry の既定 backend を選びます。go backend（`go:`）や cargo backend（`cargo:`）で接頭辞を明示したツールも、同じ `[tools]` テーブルに並べて宣言できます。env による環境変数の管理は第 13 章、tasks によるコマンドの定義は第 14 章で扱います。
:::

## 本章のまとめ

- backend は mise がツールを取得する方式です。言語ランタイムの core backend に加えて、CLI ツールの導入では aqua・github・asdf・vfox の各 backend を使います。
- registry はツールの短縮名と backend の対応表です。registry に登録されたツールは短縮名だけで宣言でき、mise が既定の backend を選びます。`mise registry` で一覧を、`mise registry <ツール>` で特定ツールの既定 backend を確認します。
- プリビルドバイナリを配布するツールには aqua backend を優先します。チェックサムと署名の検証に対応します。registry に無いツールや GitHub Releases で配布されるツールには github backend を使います。ubi backend は非推奨で、github backend に置き換えます。
- ソースからのコンパイルや環境変数の設定が必要なツールには、asdf backend または vfox backend を使います。backend を明示するには、`<backend>:<ツール識別子>` の記法で接頭辞を付けます。
- Terraform・kubectl・aws-cli は registry に登録され、既定の backend は aqua backend です。ツール名だけで宣言でき、言語ランタイムと同じ `mise.toml` に同居させて一元管理できます。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^backend-arch]: backend の体系（取得方式・優先順位・使い分けの指針・`<backend>:<ツール識別子>` の記法）。mise 公式ドキュメント「Backend Architecture」<https://mise.jdx.dev/dev-tools/backend_architecture.html>
[^registry]: registry の概念（ツールの短縮名と backend の対応・既定 backend の決定・エイリアス・対応 OS）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
[^cli-registry]: `mise registry` コマンドの仕様（引数なしで全ツール一覧・ツール名を渡すと既定 backend を表示）。mise 公式ドキュメント「mise registry」<https://mise.jdx.dev/cli/registry.html>
[^core]: core backend は mise 本体に組み込まれた言語ランタイムを取得します。Node.js・Python・Go・Ruby・Java などが対象です。mise 公式ドキュメント「Core Tools」<https://mise.jdx.dev/core-tools.html>
[^aqua]: aqua backend の概要と記法（aqua レジストリ経由の取得・チェックサム検証・Cosign 署名検証・SLSA Provenance 検証）。mise 公式ドキュメント「aqua Backend」<https://mise.jdx.dev/dev-tools/backends/aqua.html>
[^github]: github backend の概要と記法（GitHub Releases からのバイナリ取得・`github:<owner>/<repo>`・レジストリ登録不要）。mise 公式ドキュメント「GitHub Backend」<https://mise.jdx.dev/dev-tools/backends/github.html>
[^ubi]: ubi backend の概要と非推奨である点（GitHub・GitLab の Releases からの取得・github backend への移行案内）。mise 公式ドキュメント「ubi Backend」<https://mise.jdx.dev/dev-tools/backends/ubi.html>
[^asdf]: asdf backend の概要（asdf プラグイン経由の取得・Bash スクリプトによる任意コード実行・legacy の位置付け・新規プラグインを受け入れない方針）。mise 公式ドキュメント「asdf Backend」<https://mise.jdx.dev/dev-tools/backends/asdf.html>
[^vfox]: vfox backend の概要（vfox プラグイン経由の取得・Lua での記述・Windows を含む複数 OS への対応）。mise 公式ドキュメント「vfox Backend」<https://mise.jdx.dev/dev-tools/backends/vfox.html>
[^terraform]: Terraform はインフラの構成をコードで定義し適用するツールです。HashiCorp「Terraform」<https://developer.hashicorp.com/terraform>
[^kubectl]: kubectl は Kubernetes クラスタを操作するコマンドラインツールです。Kubernetes 公式ドキュメント「kubectl」<https://kubernetes.io/docs/reference/kubectl/>
[^aws-cli]: aws-cli（AWS CLI v2）は AWS を操作するコマンドラインツールです。`aws` コマンドを提供します。AWS 公式ドキュメント「AWS Command Line Interface」<https://docs.aws.amazon.com/cli/>
