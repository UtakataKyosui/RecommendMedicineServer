# GitHub Secrets 設定ガイド

## 🔐 必要なSecrets設定

CIワークフローで使用する環境変数をGitHub Secretsで安全に管理します。

### 📋 設定手順

1. **GitHubリポジトリにアクセス**
2. **Settings** タブをクリック
3. **Secrets and variables** → **Actions** を選択
4. **New repository secret** をクリック

---

## 🔑 設定すべきSecrets

### テスト用Secrets（推奨）

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `JWT_SECRET_TEST` | テスト用JWT秘密キー | `test-jwt-secret-for-ci-only` |
| `LINE_CHANNEL_SECRET_TEST` | テスト用LINEチャンネルシークレット | `test-channel-secret` |
| `LINE_CHANNEL_ACCESS_TOKEN_TEST` | テスト用LINEアクセストークン | `test-access-token` |

### 本番用Secrets（オプショナル）

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `PRODUCTION_API_URL` | 本番APIのURL | `https://api.yourdomain.com` |
| `JWT_SECRET_PROD` | 本番用JWT秘密キー | `your-secure-production-jwt-secret` |
| `LINE_CHANNEL_SECRET_PROD` | 本番用LINEチャンネルシークレット | `your-line-channel-secret` |
| `LINE_CHANNEL_ACCESS_TOKEN_PROD` | 本番用LINEアクセストークン | `your-line-access-token` |

---

## 🛠️ 具体的な設定方法

### 1. JWT_SECRET_TEST
```
Name: JWT_SECRET_TEST
Value: test-jwt-secret-for-ci-only-do-not-use-in-production
```

### 2. LINE_CHANNEL_SECRET_TEST
```
Name: LINE_CHANNEL_SECRET_TEST  
Value: test-channel-secret
```

### 3. LINE_CHANNEL_ACCESS_TOKEN_TEST
```
Name: LINE_CHANNEL_ACCESS_TOKEN_TEST
Value: test-access-token
```

### 4. PRODUCTION_API_URL（本番デプロイ時）
```
Name: PRODUCTION_API_URL
Value: https://api.yourdomain.com
```

---

## 🔄 Environment別Secrets（高度な設定）

### Development Environment
```
Name: JWT_SECRET_DEV
Value: dev-jwt-secret-key

Name: LINE_CHANNEL_SECRET_DEV  
Value: your-dev-line-channel-secret

Name: LINE_CHANNEL_ACCESS_TOKEN_DEV
Value: your-dev-line-access-token
```

### Staging Environment
```
Name: JWT_SECRET_STAGING
Value: staging-jwt-secret-key

Name: LINE_CHANNEL_SECRET_STAGING
Value: your-staging-line-channel-secret

Name: LINE_CHANNEL_ACCESS_TOKEN_STAGING
Value: your-staging-line-access-token
```

### Production Environment
```
Name: JWT_SECRET_PROD
Value: your-super-secure-production-jwt-secret

Name: LINE_CHANNEL_SECRET_PROD
Value: your-production-line-channel-secret

Name: LINE_CHANNEL_ACCESS_TOKEN_PROD
Value: your-production-line-access-token
```

---

## 📝 CIワークフローでの使用方法

### 基本的な使用
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET_TEST || 'fallback-value' }}
  LINE_CHANNEL_SECRET: ${{ secrets.LINE_CHANNEL_SECRET_TEST || 'test-secret' }}
```

### 条件分岐での使用
```yaml
- name: Set environment variables
  env:
    JWT_SECRET: ${{ 
      github.ref == 'refs/heads/main' && secrets.JWT_SECRET_PROD ||
      github.ref == 'refs/heads/develop' && secrets.JWT_SECRET_STAGING ||
      secrets.JWT_SECRET_TEST 
    }}
```

### Environment使用時
```yaml
jobs:
  deploy:
    environment: production
    steps:
    - name: Deploy
      env:
        JWT_SECRET: ${{ secrets.JWT_SECRET }}  # Environment secrets
```

---

## 🔒 セキュリティのベストプラクティス

### 1. Secret命名規則
- **環境を明示**: `_TEST`, `_STAGING`, `_PROD`
- **用途を明示**: `JWT_SECRET`, `LINE_CHANNEL_*`
- **アンダースコア使用**: `SNAKE_CASE`

### 2. フォールバック値の設定
```yaml
# ✅ 良い例: フォールバック付き
JWT_SECRET: ${{ secrets.JWT_SECRET_TEST || 'safe-test-fallback' }}

# ❌ 悪い例: ハードコード
JWT_SECRET: test-jwt-secret-hardcoded
```

### 3. テスト用値の安全性
- **テスト用Secretsも適切に管理**
- **本番データを使用しない**
- **意味のある値を設定**（完全にダミーでない）

### 4. 最小権限の原則
```yaml
# ✅ 必要な場合のみSecrets使用
- name: Run tests (no secrets needed)
  run: cargo test --lib

# ✅ 統合テスト時のみSecrets使用  
- name: Run integration tests
  env:
    DATABASE_URL: postgres://...
    JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
  run: cargo test --test "*"
```

---

## 🛡️ Secrets管理の注意点

### 禁止事項
- ❌ **ログに出力しない**: `echo ${{ secrets.SECRET_NAME }}`
- ❌ **Pull Requestで表示しない**: Fork からはSecrets使用不可
- ❌ **コードにハードコード**: `JWT_SECRET=hardcoded_value`

### 推奨事項
- ✅ **定期的なローテーション**: 3-6ヶ月ごと
- ✅ **最小権限**: 必要な場所でのみ使用
- ✅ **環境分離**: テスト・ステージング・本番で別Secrets

---

## 🔧 トラブルシューティング

### 1. Secretが認識されない
```bash
# 確認方法
echo "Secret is set: ${{ secrets.SECRET_NAME != '' }}"

# デバッグ（値は表示されない）
- name: Check secret existence
  run: |
    if [ -z "$JWT_SECRET" ]; then
      echo "JWT_SECRET is not set"
      exit 1
    else  
      echo "JWT_SECRET is set (length: ${#JWT_SECRET})"
    fi
  env:
    JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
```

### 2. フォークからのPull Request
```yaml
# Fork PRではSecretsが使用できない場合の対処
- name: Run tests  
  env:
    # Fork PRでは空文字、直接PRでは実際の値
    JWT_SECRET: ${{ secrets.JWT_SECRET_TEST || 'fallback-for-fork-pr' }}
  run: |
    if [ "$JWT_SECRET" = "fallback-for-fork-pr" ]; then
      echo "Running with fallback values (fork PR)"
      cargo test --lib  # 統合テストをスキップ
    else
      echo "Running full test suite"
      cargo test
    fi
```

### 3. 環境変数の優先順位
1. **Environment secrets** (最優先)
2. **Repository secrets** 
3. **Organization secrets**
4. **Default values** (最低優先)

---

## 📚 関連ドキュメント

- [GitHub Secrets公式ドキュメント](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Environment protection rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [セキュリティ強化ガイド](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## 🚀 セットアップチェックリスト

- [ ] GitHubリポジトリのSettings → Secrets設定完了
- [ ] `JWT_SECRET_TEST` 設定
- [ ] `LINE_CHANNEL_SECRET_TEST` 設定  
- [ ] `LINE_CHANNEL_ACCESS_TOKEN_TEST` 設定
- [ ] CI ワークフローが正常実行されることを確認
- [ ] Pull Request でSecrets が適切に動作することを確認
- [ ] 本番用Secrets（必要に応じて）設定

**💡 最低限 `JWT_SECRET_TEST` の設定だけでもCIが動作します！**
