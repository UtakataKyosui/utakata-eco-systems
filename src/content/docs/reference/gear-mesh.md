---
title: GearMesh
description: RustからTypeScriptへの型定義共有ライブラリ — リポジトリ概要
---

## 基本情報

| 項目 | 内容 |
|---|---|
| リポジトリ | [UtakataKyosui/GearMesh](https://github.com/UtakataKyosui/GearMesh) |
| 説明 | Next-generation Rust to TypeScript type definition sharing library |
| ライセンス | MIT OR Apache-2.0（デュアルライセンス） |
| Topics | `rust` `typescript` `ffi` `type-sharing` |
| Stars | 1 |
| Forks | 0 |
| Open Issues | 13 |
| Open PRs | 0 |
| 総コミット数 | 62 |
| リリース数 | 2件 |
| 最新リリース | v0.1.1（2025-12-28） |

---

## プロジェクトの動機・背景

Tauri の普及により、Rust と TypeScript 間での型定義を共有するニーズが高まった。既存の類似クレート（`ts-rs`、`typeshare`、`specta`）では、以下の点が不足していた：

- TypeScript の **Branded Type**（同じプリミティブを厳密に区別する型）の自動生成
- Rust バリデーション属性からの TypeScript **ランタイム検証コード**の生成
- **Zod スキーマ**の自動出力

既存クレートへのコントリビュートよりも、要件に特化した新規クレートとして実装する方が早いと判断して開発が始まった。

**対象ユースケース：**

- 大規模フロントエンド / バックエンド統合プロジェクト
- Tauri ベースのマルチプラットフォームアプリ開発

---

## 主要機能

### 1. Branded Types 自動生成

Rust の newtype パターンから TypeScript の Branded Type を自動生成する。同じ `String` や `u64` でも型レベルで厳密に区別できる。

```rust
#[derive(GearMesh)]
struct UserId(u64);
```

```typescript
// 生成される TypeScript
type UserId = bigint & { readonly __brand: "UserId" };
```

### 2. JSDoc 生成

Rust の `///` doc comment から TypeScript の JSDoc コメントを生成する。

### 3. ランタイムバリデーション生成

Rust のバリデーション属性から TypeScript のランタイム検証コードを生成する。

### 4. Zod スキーマ生成

型定義に対応した [Zod](https://zod.dev/) スキーマを自動出力する。

### 5. bigint 変換

`u64` / `i64` を TypeScript の `bigint` に自動変換する（JavaScript の `number` 精度問題を回避）。

---

## クイックスタート

`Cargo.toml` に追加：

```toml
[dependencies]
gear-mesh = "0.1"
```

基本的な使い方：

```rust
use gear_mesh::GearMesh;
use gear_mesh_generator::{GeneratorConfig, generate_types_to_dir};

#[derive(GearMesh)]
struct UserId(u64);

#[derive(GearMesh)]
struct User {
    id: UserId,
    name: String,
}

fn main() {
    generate_types_to_dir("generated").unwrap();
}
```

設定（`GeneratorConfig`）：

```rust
let config = GeneratorConfig {
    bigint: true,
    branded: true,
    zod: true,
    validation: true,
    ..Default::default()
};
```

---

## クレート構成（モノレポ）

| クレート | バージョン | 役割 |
|---|---|---|
| [`gear-mesh`](https://crates.io/crates/gear-mesh) | 0.1.0 | メタクレート（再エクスポート） |
| [`gear-mesh-core`](https://docs.rs/gear-mesh-core/latest/gear_mesh_core/) | 0.1.1 | 言語非依存の中間表現（IR）・型システム |
| [`gear-mesh-derive`](https://docs.rs/gear-mesh-derive/latest/gear_mesh_derive/) | 0.1.1 | `#[derive(GearMesh)]` proc-macro |
| [`gear-mesh-generator`](https://docs.rs/gear-mesh-generator/latest/gear_mesh_generator/) | 0.1.0 | TypeScript / Zod コード生成エンジン |

### 責務の分割

```
gear-mesh-core       … 言語非依存IR（Rust型 → 中間表現）
gear-mesh-derive     … Rust型からIRを取得するproc-macro
gear-mesh-generator  … IRからTypeScript/Zodコードを生成
gear-mesh            … 上記3つを再エクスポートするファサード
```

---

## ディレクトリ構造

```
GearMesh/
├── .agent/workflows/     # エージェントワークフロー設定
├── .github/              # GitHub Actions CI/CD
├── .husky/               # Gitフック
├── .moon/                # Moon ビルドシステム設定
├── crates/               # Rustクレート群（モノレポ）
├── docs/                 # ドキュメント
├── examples/             # 使用例
├── tests/e2e/            # E2Eテスト
├── Cargo.toml            # Rustワークスペース設定
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── RELEASE_NOTES_v0.1.0.md
├── deny.toml             # cargo-deny 設定
├── moon.yml              # Moonタスク定義
├── package.json          # JSツールチェーン
└── rust-toolchain.toml   # Rustツールチェーン固定
```

Rust ワークスペースを中心に、JS ツールチェーン・CI/automation・E2E テストを併設したモノレポ構成。

---

## 公開API概要

### gear-mesh-core

中間表現（IR）と型システムを定義する。

**主な struct：**
- `GearMeshType` — 型定義の最上位表現
- `StructType` — 構造体型
- `EnumType` — 列挙体型
- `EnumVariant` — enumのバリアント
- `FieldInfo` — フィールド情報
- `TypeRef` — 型参照
- `NewtypeType` — newtypeパターン
- `GenericParam` — ジェネリクスパラメータ
- `DocComment` / `DocSection` — ドキュメントコメント
- `SerdeFieldAttrs` / `SerdeTypeAttrs` — Serde属性
- `TypeAttributes` — 型属性

**主な enum：**
- `PrimitiveType` — プリミティブ型の種類
- `TypeKind` — 型の種別
- `EnumRepresentation` — enumの表現形式（Serde準拠）
- `ValidationRule` — バリデーションルール
- `VariantContent` — バリアントのコンテンツ
- `RenameRule` — フィールド名変換ルール

### gear-mesh-derive

`#[derive(GearMesh)]` proc-macro を提供する。Rust 型の定義から `gear-mesh-core` の IR を生成する。

### gear-mesh-generator

TypeScript / Zod コードの生成エンジン。

**主な公開要素：**
- `TypeScriptGenerator` — TypeScript型定義を生成
- `ValidationGenerator` — バリデーションコードを生成
- `BrandedTypeGenerator` — Branded Typeを生成
- `GeneratorConfig` — 生成オプション設定
- `GearMeshExport` trait — 型をエクスポート可能にするトレイト
- `utils::is_bigint_type` — bigint変換判定ユーティリティ

---

## 既存クレートとの比較

| 機能 | gear-mesh | ts-rs | typeshare | specta |
|---|:---:|:---:|:---:|:---:|
| 基本的な型変換 | ✅ | ✅ | ✅ | ✅ |
| Branded Types 自動生成 | ✅ | ❌ | ❌ | ❌ |
| doc comment → JSDoc | ✅ | ❌ | ❌ | 部分的 |
| Zod スキーマ生成 | ✅ | ❌ | ❌ | ✅（別途） |
| ランタイムバリデーション | ✅ | ❌ | ❌ | ❌ |
| u64/i64 → bigint | ✅ | 設定可 | ❌ | 設定可 |

---

## リリース履歴

| バージョン | 日付 | 備考 |
|---|---|---|
| v0.1.1 | 2025-12-28 | 最新リリース |
| v0.1.0 | — | 初期リリース |

---

## 言語統計

| 言語 | 割合 |
|---|---|
| Rust | 81.3% |
| Shell | 18.6% |
| JavaScript | 0.1% |

---

## リンク集

- [GitHub リポジトリ](https://github.com/UtakataKyosui/GearMesh)
- [crates.io: gear-mesh](https://crates.io/crates/gear-mesh)
- [docs.rs: gear-mesh](https://docs.rs/gear-mesh/latest/gear_mesh/)
- [docs.rs: gear-mesh-core](https://docs.rs/gear-mesh-core/latest/gear_mesh_core/)
- [docs.rs: gear-mesh-derive](https://docs.rs/gear-mesh-derive/latest/gear_mesh_derive/)
- [docs.rs: gear-mesh-generator](https://docs.rs/gear-mesh-generator/latest/gear_mesh_generator/)
- [Zenn 紹介記事](https://zenn.dev/ayaextech_fill/articles/new-rust-shared-type-to-typescript-gear-mesh)

---

> **注記：** 本ページの情報は Codex MCP による自動収集（2026-03-24）に基づいています。`gh` 認証トークンが無効だったため、Issues タイトル一覧・詳細なコミット履歴・crates.io ダウンロード統計は取得できていません。
