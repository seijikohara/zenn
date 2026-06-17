---
title: "Java / Kotlin"
---

本章では、JVM（Java Virtual Machine）言語の開発環境を mise で管理する方法を扱います。Java と Kotlin は、JDK（Java Development Kit）と Gradle・Maven を共有します。Kotlin は JDK 上で動き、ビルドツールも Java と共通です。そのため、本章は Java と Kotlin をまとめて 1 章で扱います。読了後には、JDK のバージョンと Gradle・Maven を `mise.toml` で固定し、Java と Kotlin の双方で使える設定を書けるようになります。

本章は第 3 章で mise を導入・有効化し、第 5 章でバージョン操作を理解した状態を前提とします。mise 自体のインストールは第 3 章、`mise.toml` の構文は第 4 章、`mise install` / `mise use` / `mise ls` などの操作は第 5 章で扱いました。本章はコマンドの基本操作を再説明せず、JVM 言語固有の事情に集中します。

本章のコマンド出力やバージョン番号は、執筆時点（2026 年 6 月、mise 2026.6.10[^mise-version]）の値です。実行する時期やツールの更新状況によって、表示されるバージョンは変わります。

## JDK のバージョン管理

mise は JDK を core backend で組み込み対応します[^java]。core backend は、mise が標準で内蔵するツールの取得方法です。JDK は backend の追加設定なしに、ツール名 `java` で宣言できます。backend の仕組みの詳細は第 12 章で扱います。

mise は、ビルド済みの JDK アーカイブを取得して展開します[^java]。取得元のメタデータは mise 専用の配布サービス（`mise-java.jdx.dev`）が提供し、複数ベンダーの JDK 情報をまとめます[^java-metadata]。ソースからのコンパイルは行わないため、インストールは短時間で完了します。

### ディストリビューションの選択

JDK には複数のディストリビューションがあります。各ベンダーが OpenJDK をもとにビルドし、配布します。`java` のバージョン指定では、ディストリビューションを接頭辞で選べます[^java]。記法は `<ベンダー>-<バージョン>` です。

```toml:mise.toml
[tools]
java = "temurin-21"  # Eclipse Temurin の 21 系を指定
```

mise が対応する主なディストリビューションを次の表にまとめます[^java]。

| 接頭辞 | ディストリビューション | 配布元 |
| --- | --- | --- |
| `temurin` | Eclipse Temurin | Eclipse Adoptium |
| `zulu` | Azul Zulu | Azul |
| `corretto` | Amazon Corretto | Amazon |
| `openjdk` | OpenJDK リファレンスビルド | Oracle |
| `liberica` | BellSoft Liberica | BellSoft |
| `graalvm-community` | GraalVM Community Edition | Oracle |
| `oracle-graalvm` | Oracle GraalVM | Oracle |

GraalVM を指定する接頭辞は、`graalvm-community`（コミュニティ版）または `oracle-graalvm`（Oracle 版）です。接頭辞 `graalvm` 単独は、Java の機能リリースとは別系統の旧バージョン体系を指します。`graalvm-21` は旧 GraalVM の製品バージョン 21 系（Java 8・11・17 上のビルド）に解決し、Java 21 のビルドにはなりません。Java 21 の GraalVM を使う場合は、`graalvm-community-21` または `oracle-graalvm-21` と指定します。

:::message
ディストリビューションは、配布元・ライセンス・サポート期間が異なります。チームでは 1 つのディストリビューションに統一します。長期サポート（Long Term Support、LTS）を重視する場合は Eclipse Temurin が選択肢になります。配布元の選定方針はプロジェクトごとに定めます。
:::

### バージョンの指定方法

`java` のバージョン指定には、第 4 章で説明した構文を使います。ディストリビューションの接頭辞に続けて、完全指定・部分指定・`latest` を書けます[^java]。

```toml:mise.toml
[tools]
java = "temurin-21.0.11"  # 完全指定。Temurin の 21.0.11 に固定
```

部分指定は、先頭の一部だけを書きます。`java = "temurin-21"` は、Temurin の 21 系の最新版（執筆時点では 21.0.11）に解決されます。`java = "temurin-latest"` は Temurin の最新の安定版に解決します。

接頭辞を省略すると、mise は既定のディストリビューションとして OpenJDK リファレンスビルドを使います[^java]。`java = "21"` は `openjdk-21` と同じ意味になり、Oracle が配布する OpenJDK リファレンスビルドの 21 系に解決します。既定のディストリビューションは、`java.shorthand_vendor` 設定または環境変数 `MISE_JAVA_SHORTHAND_VENDOR` で変更できます[^java-settings]。

```toml:mise.toml
[tools]
java = "21"  # 接頭辞なし。既定の openjdk-21 に解決
```

:::message
OpenJDK リファレンスビルドは、各メジャーバージョンについて直近の数パッチだけを配布します。古いパッチは配布対象から外れます。特定のパッチを長期に固定する場合は、Eclipse Temurin など各メジャーの全パッチを配布するディストリビューションを選びます。`latest` と部分指定はインストール時点の最新版に解決し、インストール後は自動では更新されません。
:::

### インストールと確認

`mise use` でバージョンを宣言し、インストールします。次の例は、プロジェクトのディレクトリで Temurin の 21 系を宣言します。

```shell
$ mise use java@temurin-21
mise java@temurin-21.0.11+10.0.LTS  ✓ installed
mise ~/work/my-app/mise.toml tools: java@temurin-21
```

部分指定の `temurin-21` は、執筆時点では `temurin-21.0.11+10.0.LTS` に解決します。インストール後、`java -version` で有効なバージョンを確認します。`java -version` は、出力をエラー出力（標準エラー）に書き出します。

```shell
$ java -version
openjdk version "21.0.11" 2026-04-21 LTS
OpenJDK Runtime Environment Temurin-21.0.11+10 (build 21.0.11+10-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.11+10 (build 21.0.11+10-LTS, mixed mode)
```

出力の 1 行目はバージョン番号を、2 行目以降はランタイムとビルドの情報を示します。`Temurin-21.0.11+10` の表示が、ディストリビューションとして Eclipse Temurin を使っていることを示します。

### .java-version を読み込む

mise は、JDK 向けのバージョンファイルである `.java-version` と `.sdkmanrc` を読み込めます[^java]。mise は、asdf のレガシーバージョンファイルにならって、`.java-version` と `.sdkmanrc` を idiomatic version files と呼びます[^idiomatic]。

ただし、idiomatic version files の読み込みは既定で無効です[^idiomatic]。`.java-version` を置いただけでは、mise は JDK のバージョンを解決しません。読み込みを有効にするには、`idiomatic_version_file_enable_tools` 設定にツール名を追加します。

```shell
$ mise settings add idiomatic_version_file_enable_tools java
```

設定を追加すると、mise は `.java-version` の内容を JDK のバージョンとして解決します。次の例は、`temurin-21.0.11` を記述した `.java-version` を読み込んだ結果です。`Source` 列が `.java-version` を指します。

```shell
$ mise ls java
Tool  Version                   Source                       Requested
java  temurin-21.0.11+10.0.LTS  ~/work/my-app/.java-version  temurin-21.0.11
```

:::message
idiomatic version files が既定で無効になったのは、mise 2025.10.0 からです[^idiomatic-default]。それ以前のバージョンでは既定で有効でした。新規のプロジェクトでは `mise.toml` を使い、`.java-version` と `.sdkmanrc` は他ツールからの移行や互換性の維持に用います。
:::

## JAVA_HOME の自動設定

多くの JVM 系ツールは、JDK の場所を環境変数 `JAVA_HOME` から得ます。Gradle・Maven・IDE は、`JAVA_HOME` が指す JDK でビルドし、コードを実行します。mise は、`java` を有効化すると `JAVA_HOME` を自動で設定します[^java]。

`JAVA_HOME` の自動設定は、`mise activate` でシェルに mise を組み込んだ状態で機能します[^java]。shim だけを使う構成では、`JAVA_HOME` は設定されません。`mise activate` の設定は第 3 章で扱いました。

`mise env` で、mise が設定する環境変数を確認できます。次の例は、`JAVA_HOME` の設定を抜粋します。

```shell
$ mise env | grep JAVA_HOME
export JAVA_HOME=~/.local/share/mise/installs/java/temurin-21.0.11+10.0.LTS
```

macOS では、`JAVA_HOME` は mise のインストールディレクトリ直下の JDK ホームを指します。古い JDK で見られた `Contents/Home` の階層は挟まりません。mise がインストールした JDK の実体は `~/.local/share/mise/installs/java/<バージョン>` に展開され、`JAVA_HOME` はそのパスを指します。

:::message
`JAVA_HOME` を前提とするツールは、`mise activate` を設定したシェルで実行します。`mise activate` を使わずにツールを実行する場合は、`mise exec -- <コマンド>` でコマンドを包むと、mise が環境変数を設定したうえでコマンドを実行します。`[env]` セクションによる環境変数の管理は第 13 章で扱います。
:::

## Gradle と Maven の管理

Java と Kotlin のビルドには、Gradle または Maven を使います。mise は、Gradle と Maven を registry に登録しており、ツール名で `mise.toml` に宣言できます[^registry]。registry は、mise が認識するツール名と取得方法の対応表です。Gradle と Maven は core backend ではなく、aqua backend でプリビルドバイナリを取得します[^registry]。aqua backend は、プリビルドバイナリの配布定義を集めた仕組みです。backend の使い分けの詳細は第 12 章で扱います。

### Gradle

mise はツール名 `gradle` で Gradle を宣言できます。バージョン指定は、完全指定・部分指定・`latest` に対応します。

```toml:mise.toml
[tools]
java = "temurin-21"
gradle = "9"  # Gradle 9 系の最新に解決
```

`mise install` でインストールし、`gradle -v` でバージョンを確認します。部分指定の `gradle = "9"` は、執筆時点では 9.5.1 に解決します。

```shell
$ mise install
mise gradle@9.5.1                   ✓ installed
$ gradle -v

------------------------------------------------------------
Gradle 9.5.1
------------------------------------------------------------

Build time:    2026-05-12 13:19:42 UTC
Kotlin:        2.3.20
Groovy:        4.0.29
Launcher JVM:  21.0.11 (Eclipse Adoptium 21.0.11+10-LTS)
OS:            Mac OS X 15.7.7 x86_64
```

`gradle -v` の出力は、Gradle のバージョンに続けて、Gradle が内蔵する Kotlin・Groovy のバージョンと、ビルドに使う JVM を表示します。`Launcher JVM` の行が、mise で固定した Temurin の JDK を指します。前掲の例は冒頭の主要な行だけを抜粋しています。

### Maven

mise はツール名 `maven` で Maven を宣言できます。ツール名は `maven` であり、コマンド名の `mvn` はツール名としては使えません。

```toml:mise.toml
[tools]
java = "temurin-21"
maven = "3"  # Maven 3 系の最新に解決
```

`mvn -v` でバージョンを確認します。部分指定の `maven = "3"` は、執筆時点では 3.9.16 に解決します。Maven 4 系は執筆時点でリリース候補（Release Candidate、RC）の段階で、安定版は 3.9 系です。

```shell
$ mvn -v
Apache Maven 3.9.16 (2bdd9fddda4b155ebf8000e807eb73fd829a51d5)
Maven home: ~/.local/share/mise/installs/maven/3/apache-maven-3.9.16
Java version: 21.0.11, vendor: Eclipse Adoptium, runtime: ~/.local/share/mise/installs/java/temurin-21.0.11+10.0.LTS
```

`mvn -v` の出力は、Maven のバージョンに続けて、Maven が使う JDK のバージョンとベンダーを表示します。`Java version` の行が、mise で固定した Temurin の JDK を指します。前掲の例は冒頭の主要な行だけを抜粋しています。

### ラッパーとの関係

Gradle と Maven には、ラッパー（Gradle Wrapper・Maven Wrapper）があります。ラッパーは、プロジェクトに同梱したスクリプト（`gradlew`・`mvnw`）で、プロジェクトが指定したバージョンの Gradle・Maven を自動で取得して実行します[^gradle-wrapper][^maven-wrapper]。ラッパーは Gradle・Maven のバージョンを固定する仕組みで、mise の `[tools]` とは別系統です。

mise が宣言する `gradle`・`maven` は、`gradle`・`mvn` コマンドの本体を取得します。ラッパーの `gradlew`・`mvnw` は、ラッパー自身が記録したバージョンを取得します。両者は固定の仕組みが独立しており、mise の公式ドキュメントはラッパーとの連携を規定していません。ラッパーを使うプロジェクトでは、ビルドツールのバージョンをラッパーで固定し、mise では JDK を固定する分担も選べます。バージョンをそろえる場合は、`mise.toml` とラッパーの記録を同じバージョンに合わせます。

:::message
ラッパーは、`JAVA_HOME` が指す JDK を使ってビルドします。mise で JDK を固定すれば、ラッパーで取得した Gradle・Maven も mise の JDK でビルドします。ビルドツール本体を mise とラッパーのどちらで固定するかは、プロジェクトの方針で決めます。
:::

## Kotlin の扱い

Kotlin は JDK 上で動く言語です。Kotlin のコードは JVM のバイトコードにコンパイルされ、JDK のランタイムで実行されます。ビルドには Java と同じ Gradle・Maven を使います。そのため、Kotlin の開発環境は、多くの場合 JDK と Gradle・Maven の管理だけで足ります。Kotlin のバージョンは、Gradle・Maven のビルド設定（Kotlin Gradle プラグインなど）で指定し、ビルドツールが対応するコンパイラを取得します。

mise で JDK と Gradle・Maven を固定すると、Kotlin プロジェクトのビルド環境がそろいます。前述の `java` と `gradle` の宣言は、そのまま Kotlin プロジェクトに使えます。

### Kotlin コンパイラの管理

Gradle・Maven を介さず、Kotlin のコマンドラインコンパイラ（`kotlinc`）を直接使う場合は、mise でツール名 `kotlin` を宣言します。スクリプトの実行や、ビルドツールを使わない小さなコードのコンパイルに利用します。mise は、`kotlin` を JetBrains の GitHub リリースから取得し、Kotlin コンパイラ（`kotlinc`）を導入します[^registry]。

```toml:mise.toml
[tools]
java = "temurin-21"
kotlin = "2"  # Kotlin 2 系の最新に解決
```

`kotlinc -version` でバージョンを確認します。`kotlinc` は JDK 上で動くため、`java` を併せて宣言します。部分指定の `kotlin = "2"` は、執筆時点では 2.4.0 に解決します。`kotlinc -version` は、出力をエラー出力に書き出します。

```shell
$ kotlinc -version
info: kotlinc-jvm 2.4.0 (JRE 21.0.11+10-LTS)
```

出力は、Kotlin コンパイラのバージョンに続けて、実行に使う JRE（Java Runtime Environment）のバージョンを示します。`JRE 21.0.11+10-LTS` の表示が、mise で固定した Temurin の JDK を指します。

:::message
Gradle・Maven でビルドする Kotlin プロジェクトでは、コンパイラのバージョンをビルド設定で指定するため、mise で `kotlin` を宣言する必要は通常ありません。mise の `kotlin` は、`kotlinc` を直接使う場合に宣言します。
:::

## プロジェクトの mise.toml の実例

本章で扱った設定をまとめて、JVM プロジェクトの `mise.toml` の例を示します。JDK のディストリビューションとバージョンを固定し、ビルドツールに Gradle を宣言します。Java と Kotlin のどちらのプロジェクトでも、同じ設定を使えます。

```toml:mise.toml
[tools]
java = "temurin-21"  # Eclipse Temurin の 21 系を固定
gradle = "9"         # Gradle 9 系の最新に固定
```

設定後、`mise install` でツールをまとめてインストールします。インストール後、JDK とビルドツールのバージョン、および `JAVA_HOME` の設定を確認します。

```shell
$ mise install
mise java@temurin-21.0.11+10.0.LTS  ✓ installed
mise gradle@9.5.1                   ✓ installed
$ java -version
openjdk version "21.0.11" 2026-04-21 LTS
OpenJDK Runtime Environment Temurin-21.0.11+10 (build 21.0.11+10-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.11+10 (build 21.0.11+10-LTS, mixed mode)
$ mise env | grep JAVA_HOME
export JAVA_HOME=~/.local/share/mise/installs/java/temurin-21.0.11+10.0.LTS
```

`java -version` は Temurin の JDK を、`JAVA_HOME` は JDK の場所を示します。Gradle は `JAVA_HOME` が指す JDK を使ってビルドします。`mise.toml` をバージョン管理システムにコミットすると、チームの全員が同じ JDK と Gradle を使い、同じ環境でビルドできます。

## 本章のまとめ

- Java と Kotlin は JDK と Gradle・Maven を共有します。mise で JDK とビルドツールを固定すると、Java と Kotlin の双方で同じ設定を使えます。
- mise は JDK を core backend で組み込み対応します。ツール名 `java` で宣言し、`<ベンダー>-<バージョン>` の記法でディストリビューションを選びます。接頭辞を省略すると既定の OpenJDK リファレンスビルドに解決します。
- mise は `java` を有効化すると `JAVA_HOME` を自動設定します。`mise activate` が前提です。macOS では `~/.local/share/mise/installs/java/<バージョン>` を指し、`Contents/Home` は挟まりません。
- Gradle と Maven は aqua backend で取得します。ツール名 `gradle`・`maven` で宣言します。ラッパー（`gradlew`・`mvnw`）はビルドツールを固定する別系統で、mise の公式ドキュメントは連携を規定しません。
- Kotlin は JDK 上で動き、ビルドに Gradle・Maven を使うため、多くの場合は JDK とビルドツールの管理で足ります。`kotlinc` を直接使う場合は、ツール名 `kotlin` で Kotlin コンパイラを宣言します。

[^mise-version]: mise のバージョンは執筆時点の安定版です。最新版は mise 公式リポジトリのリリースで確認できます。<https://github.com/jdx/mise/releases>
[^java]: mise での Java の管理（core backend・ビルド済みアーカイブの取得・ディストリビューションの接頭辞・既定ベンダー・`JAVA_HOME` の自動設定・`.java-version` と `.sdkmanrc` の読み込み）。mise 公式ドキュメント「Java」<https://mise.jdx.dev/lang/java.html>
[^java-metadata]: mise が JDK のメタデータを取得する配布サービス。mise 公式の `mise-java.jdx.dev` が、joschi/java-metadata をもとに複数ベンダーの JDK 情報を提供します。JDK メタデータの上流プロジェクト「java-metadata」<https://github.com/joschi/java-metadata>
[^java-settings]: 既定のディストリビューションを変更する `java.shorthand_vendor` 設定と環境変数 `MISE_JAVA_SHORTHAND_VENDOR`。mise 公式ドキュメント「Settings」<https://mise.jdx.dev/configuration/settings.html>
[^idiomatic]: mise が読み込む idiomatic version files（`.java-version`・`.sdkmanrc` など）と、既定で無効である点、`idiomatic_version_file_enable_tools` 設定。mise 公式ドキュメント「Configuration」<https://mise.jdx.dev/configuration.html>
[^idiomatic-default]: idiomatic version files の既定が無効に変わった経緯（mise 2025.10.0）。mise 公式リポジトリの Discussion「Disabling idiomatic version files by default」<https://github.com/jdx/mise/discussions/4345>
[^registry]: mise registry でのツール名と backend の対応（gradle は aqua、maven は aqua、kotlin は JetBrains の GitHub リリースで取得）。mise 公式ドキュメント「Registry」<https://mise.jdx.dev/registry.html>
[^gradle-wrapper]: Gradle Wrapper（`gradlew`）は、プロジェクトが宣言したバージョンの Gradle を取得して実行します。Gradle 公式ドキュメント「Gradle Wrapper Reference」<https://docs.gradle.org/current/userguide/gradle_wrapper.html>
[^maven-wrapper]: Maven Wrapper（`mvnw`）は、プロジェクトが宣言したバージョンの Maven を取得して実行します。Apache Maven 公式ドキュメント「Maven Wrapper」<https://maven.apache.org/wrapper/>
