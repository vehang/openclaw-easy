#!/bin/bash
# 微信公众号账号管理工具

ACCOUNTS_FILE="/root/.openclaw/skills/wechat-ai-publisher/accounts.json"

# 显示所有账号
list_accounts() {
  echo "📋 已配置的公众号账号："
  echo ""
  jq -r '.accounts | to_entries[] | "  [\(.key)] \(.value.name) - AppID: \(.value.appid // "未配置")"' "$ACCOUNTS_FILE"
  echo ""
  echo "默认账号: $(jq -r '.default' "$ACCOUNTS_FILE")"
}

# 添加账号
add_account() {
  local id="$1"
  local name="$2"
  local appid="$3"
  local secret="$4"
  
  if [ -z "$id" ] || [ -z "$name" ] || [ -z "$appid" ] || [ -z "$secret" ]; then
    echo "用法: $0 add <账号ID> <账号名称> <AppID> <AppSecret>"
    exit 1
  fi
  
  tmp=$(mktemp)
  jq --arg id "$id" \
     --arg name "$name" \
     --arg appid "$appid" \
     --arg secret "$secret" \
     '.accounts[$id] = {"name": $name, "appid": $appid, "secret": $secret, "author": "", "default_style": "github", "default_images": "封面+3张"}' \
     "$ACCOUNTS_FILE" > "$tmp" && mv "$tmp" "$ACCOUNTS_FILE"
  
  echo "✅ 账号 [$id] 添加成功"
}

# 设置默认账号
set_default() {
  local id="$1"
  if [ -z "$id" ]; then
    echo "用法: $0 default <账号ID>"
    exit 1
  fi
  
  tmp=$(mktemp)
  jq --arg id "$id" '.default = $id' "$ACCOUNTS_FILE" > "$tmp" && mv "$tmp" "$ACCOUNTS_FILE"
  echo "✅ 默认账号已设置为: $id"
}

# 帮助
show_help() {
  echo "微信公众号账号管理工具"
  echo ""
  echo "用法:"
  echo "  $0 list              显示所有账号"
  echo "  $0 add <ID> <名称> <AppID> <Secret>   添加新账号"
  echo "  $0 default <ID>      设置默认账号"
  echo ""
  echo "示例:"
  echo "  $0 add tech 技术号 wx123 abc456"
  echo "  $0 default tech"
}

case "$1" in
  list|ls)
    list_accounts
    ;;
  add)
    add_account "$2" "$3" "$4" "$5"
    ;;
  default)
    set_default "$2"
    ;;
  *)
    show_help
    ;;
esac
