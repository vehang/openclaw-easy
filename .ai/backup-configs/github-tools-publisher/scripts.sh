#!/bin/bash
# GitHub Trending 采集脚本（简化版）

set -e

# 配置
SINCE="${1:-daily}"
LANGUAGE="${2:-}"
LIMIT="${3:-5}"

echo "📦 开始采集 GitHub 热门项目..."
echo "时间范围: $SINCE, 语言: ${LANGUAGE:-全部}, 数量: $LIMIT"
echo ""

# 构建 GitHub 搜索查询
query="stars:>500"

if [ -n "$LANGUAGE" ]; then
  query="$query language:$LANGUAGE"
fi

# 根据时间范围调整
case "$SINCE" in
  daily)
    # 今日热门：最近推送的
    date_filter=$(date -d "1 day ago" +"%Y-%m-%d" 2>/dev/null || date -v-1d +"%Y-%m-d" 2>/dev/null || echo "2026-02-27")
    query="$query pushed:>$date_filter"
    ;;
  weekly)
    date_filter=$(date -d "7 days ago" +"%Y-%m-%d" 2>/dev/null || date -v-7d +"%Y-%m-d" 2>/dev/null || echo "2026-02-21")
    query="$query pushed:>$date_filter"
    ;;
  monthly)
    date_filter=$(date -d "30 days ago" +"%Y-%m-%d" 2>/dev/null || date -v-30d +"%Y-%m-d" 2>/dev/null || echo "2026-01-28")
    query="$query pushed:>$date_filter"
    ;;
esac

# URL 编码查询
encoded_query=$(echo "$query" | sed 's/ /%20/g; s/>/%3E/g; s/:/%3A/g')

url="https://api.github.com/search/repositories?q=$encoded_query&sort=stars&order=desc&per_page=$LIMIT"

echo "🔍 搜索 URL: $url"
echo ""

# 获取数据
response=$(curl -s "$url")

# 检查是否成功
if ! echo "$response" | jq -e '.items' > /dev/null 2>&1; then
  echo "❌ 获取数据失败"
  echo "$response"
  exit 1
fi

# 输出项目列表
echo "📋 热门项目列表："
echo ""

echo "$response" | jq -r '.items[] | 
  "## \(.name) ⭐ \(.stargazers_count)\n\n**描述**: \(.description // "暂无")\n\n**语言**: \(.language // "未知")\n\n**链接**: \(.html_url)\n\n---\n"'

echo ""
echo "✅ 采集完成！共 $(echo "$response" | jq '.items | length') 个项目"
