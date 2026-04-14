#!/bin/bash
# openclaw-easy 更新脚本 v2
# 同级目录 + 测试启动 + mv 切换
#
# 核心思路：
#   解压到 /app/openclaw-easy-new/ → 拷贝 node_modules → npm install →
#   测试启动 18781 验证 → supervisorctl stop → mv 切换 → supervisorctl start
#
# 优势：
#   - 18780 在整个更新过程中正常运行，只有最后 mv 的毫秒级中断
#   - 测试失败 = 不切换 = 不需要回滚
#   - node_modules 新旧隔离，安全可靠

APP_DIR="/app/openclaw-easy"
APP_DIR_NEW="/app/openclaw-easy-new"
APP_DIR_BAK="/app/openclaw-easy-bak"
BACKUP_BASE="/tmp/openclaw-easy-backup"
UPDATE_BASE="/tmp/openclaw-easy-update"
MARKER_FILE="/tmp/openclaw-easy-update-marker"
LOG_FILE="/var/log/supervisor/update.log"
TEST_PORT=18781

# 备份排除列表
BACKUP_EXCLUDES=(
    "node_modules"
    "tmp"
    ".git"
    ".env"
    ".env.local"
)

# 支持的压缩格式配置
ARCHIVE_FORMATS=(
    "tar.gz|gzip tar|tar -xzf|Gzip 压缩的 TAR 归档"
    "tgz|gzip tar|tar -xzf|Gzip 压缩的 TAR 归档"
    "tar.bz2|bzip2 tar|tar -xjf|Bzip2 压缩的 TAR 归档"
    "tar.xz|xz tar|tar -xJf|XZ 压缩的 TAR 归档"
    "zip|unzip|unzip -q|ZIP 归档"
    "gz|gzip|gunzip -c|Gzip 单文件压缩"
    "7z|7z|7z x -y|7-Zip 归档"
)

# ==================== 工具函数 ====================

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

error_exit() {
    log "❌ 错误: $1"
    log "更新失败，旧版本不受影响"
    # 清理新目录（如果存在）
    if [ -d "$APP_DIR_NEW" ]; then
        log "清理新目录: $APP_DIR_NEW"
        rm -rf "$APP_DIR_NEW"
    fi
    exit 1
}

# ==================== 压缩格式检测 ====================

detect_archive_format() {
    local file="$1"
    [ ! -f "$file" ] && return 1

    local filename=$(basename "$file")
    local ext=""

    if [[ "$filename" =~ \.tar\.(gz|bz2|xz)$ ]]; then
        ext="tar.${BASH_REMATCH[1]}"
    elif [[ "$filename" =~ \.([a-z0-9]+)$ ]]; then
        ext="${BASH_REMATCH[1]}"
    fi

    if command -v file &> /dev/null; then
        local file_type=$(file -b "$file" 2>/dev/null)
        case "$file_type" in
            *"gzip compressed"*)  [[ "$filename" == *.tar.gz || "$filename" == *.tgz ]] && ext="tar.gz" || ext="gz" ;;
            *"bzip2 compressed"*) ext="tar.bz2" ;;
            *"XZ compressed"*)    ext="tar.xz" ;;
            *"Zip archive"*)      ext="zip" ;;
            *"7-zip archive"*)    ext="7z" ;;
        esac
    fi

    for format in "${ARCHIVE_FORMATS[@]}"; do
        IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format"
        [ "$ext" = "$fmt_ext" ] && echo "$format" && return 0
    done
    return 1
}

extract_archive() {
    local file="$1"
    local dest_dir="$2"
    local format_info=$(detect_archive_format "$file")
    [ -z "$format_info" ] && log "❌ 无法识别压缩格式" && return 1

    IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format_info"
    log "压缩格式: .$fmt_ext ($fmt_desc)"

    # 检测工具
    for tool in $fmt_tools; do
        if ! command -v "$tool" &> /dev/null; then
            log "❌ 缺少解压工具: $tool" && return 1
        fi
    done

    mkdir -p "$dest_dir"

    case "$fmt_ext" in
        tar.gz|tgz|tar.bz2|tar.xz) $fmt_cmd "$file" -C "$dest_dir" 2>&1 ;;
        zip)    unzip -q "$file" -d "$dest_dir" 2>&1 ;;
        gz)     gunzip -c "$file" > "$dest_dir/$(basename "$file" .gz)" 2>&1 ;;
        7z)     7z x -y "$file" -o"$dest_dir" 2>&1 ;;
        *)      log "❌ 未实现的格式: $fmt_ext" && return 1 ;;
    esac
}

get_filename_from_url() {
    local filename=$(basename "$1" | cut -d'?' -f1)
    [ -z "$filename" ] || [[ "$filename" == *"="* ]] && filename="update.tar.gz"
    echo "$filename"
}

# ==================== 测试启动 ====================

test_start() {
    log "测试启动新版本 (端口: $TEST_PORT)..."

    # 检查测试端口是否被占用
    if command -v lsof &> /dev/null; then
        local pid=$(lsof -ti:$TEST_PORT 2>/dev/null)
        if [ -n "$pid" ]; then
            log "测试端口 $TEST_PORT 被占用 (PID: $pid)，先终止"
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi
    fi

    # 启动测试进程
    cd "$APP_DIR_NEW" || return 1
    PORT=$TEST_PORT node server.js >> "$LOG_FILE" 2>&1 &
    local test_pid=$!

    log "测试进程 PID: $test_pid，等待启动..."

    # 等待最多 10 秒
    local waited=0
    while [ $waited -lt 10 ]; do
        sleep 1
        waited=$((waited + 1))

        # 检查进程是否还在
        if ! kill -0 $test_pid 2>/dev/null; then
            log "❌ 测试进程已退出（启动失败），等待了 ${waited} 秒"
            return 1
        fi

        # 尝试访问
        if curl -sf "http://127.0.0.1:$TEST_PORT/api/status" > /dev/null 2>&1; then
            log "✅ 测试启动成功（${waited} 秒）"
            kill $test_pid 2>/dev/null || true
            wait $test_pid 2>/dev/null || true
            sleep 1
            return 0
        fi
    done

    log "❌ 测试启动超时（10秒内未响应）"
    kill $test_pid 2>/dev/null || true
    wait $test_pid 2>/dev/null || true
    return 1
}

# ==================== 主更新函数 ====================

main() {
    local download_url="$1"
    [ -z "$download_url" ] && error_exit "下载地址不能为空"

    local timestamp=$(date +%s)
    local backup_dir="$BACKUP_BASE-$timestamp"
    local update_dir="$UPDATE_BASE-$timestamp"

    log ""
    log "=========================================="
    log "  开始更新 (同级目录 + 测试启动 + mv 切换)"
    log "=========================================="
    log "时间戳: $timestamp"
    log "下载地址: $download_url"

    # ==================== [1/8] 准备 ====================
    log ""
    log "[1/8] 准备环境..."

    # 检查是否有上次遗留的新目录
    if [ -d "$APP_DIR_NEW" ]; then
        log "清理上次遗留的新目录: $APP_DIR_NEW"
        rm -rf "$APP_DIR_NEW"
    fi

    # 检查是否有上次遗留的备份目录
    if [ -d "$APP_DIR_BAK" ]; then
        log "清理上次遗留的 bak 目录: $APP_DIR_BAK"
        rm -rf "$APP_DIR_BAK"
    fi

    mkdir -p "$APP_DIR_NEW" || error_exit "创建新目录失败: $APP_DIR_NEW"
    mkdir -p "$backup_dir"  || error_exit "创建备份目录失败"
    mkdir -p "$update_dir"  || error_exit "创建更新临时目录失败"

    # ==================== [2/8] 备份当前版本 ====================
    log ""
    log "[2/8] 备份当前版本..."

    # 保存 package.json 用于后续对比
    [ -f "$APP_DIR/package.json" ] && cp "$APP_DIR/package.json" "$backup_dir/package.json.bak"

    # 备份（排除 node_modules 等大目录）
    local backup_items="server.js version.json package.json package-lock.json constants routes middleware utils state tasks docker public docs"
    local backed=0
    for item in $backup_items; do
        if [ -e "$APP_DIR/$item" ]; then
            cp -a "$APP_DIR/$item" "$backup_dir/" 2>/dev/null && backed=$((backed + 1))
        fi
    done
    log "备份完成: $backed 项 → $backup_dir"

    # 写标记文件
    echo "$backup_dir" > "$MARKER_FILE"

    # ==================== [3/8] 下载 ====================
    log ""
    log "[3/8] 下载更新包..."

    local archive_file=$(get_filename_from_url "$download_url")
    local archive_path="$update_dir/$archive_file"

    if command -v wget &> /dev/null; then
        wget -q -O "$archive_path" "$download_url" || { rm -rf "$update_dir"; error_exit "wget 下载失败"; }
    elif command -v curl &> /dev/null; then
        curl -sL -o "$archive_path" "$download_url" || { rm -rf "$update_dir"; error_exit "curl 下载失败"; }
    else
        error_exit "没有可用的下载工具 (wget/curl)"
    fi

    [ ! -f "$archive_path" ] || [ ! -s "$archive_path" ] && error_exit "下载文件为空"
    log "下载完成: $(( $(stat -c%s "$archive_path" 2>/dev/null || echo 0) / 1024 )) KB"

    # ==================== [4/8] 解压到新目录 ====================
    log ""
    log "[4/8] 解压到新目录..."

    if ! extract_archive "$archive_path" "$update_dir/extracted"; then
        rm -rf "$update_dir"
        error_exit "解压失败"
    fi

    # 检测单目录结构
    local source_dir="$update_dir/extracted"
    local items=$(ls -A "$source_dir" 2>/dev/null)
    local item_count=$(echo "$items" | wc -w)
    if [ "$item_count" -eq 1 ]; then
        local single_item=$(echo "$items")
        if [ -d "$source_dir/$single_item" ]; then
            source_dir="$source_dir/$single_item"
            log "单目录结构: $single_item/"
        fi
    fi

    # 校验关键文件
    if [ ! -f "$source_dir/server.js" ] && [ ! -f "$source_dir/package.json" ]; then
        rm -rf "$update_dir"
        error_exit "更新包缺少 server.js 或 package.json"
    fi

    # 移动到新目录
    cp -a "$source_dir"/* "$APP_DIR_NEW/" 2>/dev/null
    cp -a "$source_dir"/.* "$APP_DIR_NEW/" 2>/dev/null || true  # 包含隐藏文件
    log "解压完成 → $APP_DIR_NEW"

    # 清理下载临时文件
    rm -rf "$update_dir"

    # ==================== [5/8] 拷贝 node_modules ====================
    log ""
    log "[5/8] 拷贝 node_modules..."

    if [ -d "$APP_DIR/node_modules" ]; then
        log "cp -a $APP_DIR/node_modules → $APP_DIR_NEW/node_modules"
        cp -a "$APP_DIR/node_modules" "$APP_DIR_NEW/node_modules"
        log "✅ node_modules 拷贝完成"
    else
        log "⚠️ 旧目录无 node_modules（首次安装？），跳过"
    fi

    # ==================== [6/8] npm install ====================
    log ""
    log "[6/8] 检查依赖..."

    # 对比 package.json
    local old_pkg="$backup_dir/package.json.bak"
    local new_pkg="$APP_DIR_NEW/package.json"

    local need_npm=false
    if [ -f "$old_pkg" ] && [ -f "$new_pkg" ]; then
        if ! cmp -s "$old_pkg" "$new_pkg"; then
            need_npm=true
            log "package.json 有变化，需要 npm install"
        else
            log "package.json 未变化，跳过 npm install"
        fi
    else
        need_npm=true
        log "无法对比 package.json，执行 npm install"
    fi

    if [ "$need_npm" = true ]; then
        log "执行 npm install --production..."
        cd "$APP_DIR_NEW" || error_exit "无法进入新目录"
        if command -v npm &> /dev/null; then
            if npm install --production --no-audit --no-fund 2>&1 | while read line; do log "  npm: $line"; done; then
                log "✅ npm install 完成"
            else
                log "⚠️ npm install 失败，继续尝试（已有 node_modules 可能够用）"
            fi
        else
            log "⚠️ npm 命令不存在"
        fi
    fi

    # ==================== [7/8] 测试启动 ====================
    log ""
    log "[7/8] 测试启动验证..."

    if ! test_start; then
        log "❌ 测试启动失败，不切换"
        log "旧版本 $APP_DIR 完全不受影响"
        rm -rf "$APP_DIR_NEW"
        rm -f "$MARKER_FILE"
        exit 1
    fi
    log "✅ 测试启动验证通过"

    # ==================== [8/8] mv 切换 ====================
    log ""
    log "[8/8] mv 切换..."

    # ① 停止服务
    log "停止当前服务..."
    if command -v supervisorctl &> /dev/null; then
        supervisorctl stop openclaw-easy 2>&1 | while read line; do log "  $line"; done
    else
        log "⚠️ supervisorctl 不可用，尝试 kill"
        pkill -f "node.*openclaw-easy/server.js" 2>/dev/null || true
    fi
    sleep 2

    # ② mv 切换
    log "mv $APP_DIR → $APP_DIR_BAK"
    mv "$APP_DIR" "$APP_DIR_BAK" || error_exit "mv 旧目录失败"

    log "mv $APP_DIR_NEW → $APP_DIR"
    mv "$APP_DIR_NEW" "$APP_DIR" || {
        log "❌ mv 新目录失败，紧急回滚"
        mv "$APP_DIR_BAK" "$APP_DIR" 2>/dev/null || true
        error_exit "mv 新目录失败，已回滚"
    }

    log "✅ mv 切换完成（毫秒级）"

    # ③ 启动新服务
    log "启动新版本..."
    if command -v supervisorctl &> /dev/null; then
        supervisorctl start openclaw-easy 2>&1 | while read line; do log "  $line"; done
    else
        log "⚠️ supervisorctl 不可用，手动启动"
        cd "$APP_DIR" && node server.js &
    fi

    # ④ 验证新服务
    log "等待新服务启动..."
    local verified=false
    for i in $(seq 1 15); do
        sleep 1
        if curl -sf "http://127.0.0.1:18780/api/status" > /dev/null 2>&1; then
            log "✅ 新服务启动成功（${i}秒）"
            verified=true
            break
        fi
    done

    if [ "$verified" = true ]; then
        # 成功：清理
        log "清理 bak 目录..."
        rm -rf "$APP_DIR_BAK"
        rm -f "$MARKER_FILE"

        # 清理旧备份（保留最近 5 个）
        local backup_count=$(ls -d "$BACKUP_BASE"-* 2>/dev/null | wc -l)
        if [ "$backup_count" -gt 5 ]; then
            ls -dt "$BACKUP_BASE"-* 2>/dev/null | tail -n +6 | while read old; do
                rm -rf "$old"
                log "清理旧备份: $old"
            done
        fi

        log ""
        log "=========================================="
        log "  ✅ 更新完成！"
        log "=========================================="
    else
        # 失败：回滚
        log "❌ 新服务 15 秒内未响应，回滚..."

        if command -v supervisorctl &> /dev/null; then
            supervisorctl stop openclaw-easy 2>&1 | while read line; do log "  $line"; done
        else
            pkill -f "node.*openclaw-easy/server.js" 2>/dev/null || true
        fi
        sleep 2

        rm -rf "$APP_DIR"
        mv "$APP_DIR_BAK" "$APP_DIR"
        log "已回滚到旧版本"

        if command -v supervisorctl &> /dev/null; then
            supervisorctl start openclaw-easy 2>&1 | while read line; do log "  $line"; done
        fi

        log ""
        log "=========================================="
        log "  ⚠️ 更新失败，已回滚到旧版本"
        log "=========================================="
        exit 1
    fi
}

# ==================== 回滚函数 ====================

rollback() {
    local backup_dir="$1"
    [ -z "$backup_dir" ] && [ -f "$MARKER_FILE" ] && backup_dir=$(cat "$MARKER_FILE")
    [ -z "$backup_dir" ] && log "❌ 无备份目录" && return 1
    [ ! -d "$backup_dir" ] && log "❌ 备份目录不存在: $backup_dir" && rm -f "$MARKER_FILE" && return 1

    log "========== 开始回滚 =========="
    log "备份目录: $backup_dir"

    # 如果有 bak 目录，优先用 bak 回滚（更完整）
    if [ -d "$APP_DIR_BAK" ]; then
        log "发现 bak 目录，使用 bak 回滚（更完整）"
        if command -v supervisorctl &> /dev/null; then
            supervisorctl stop openclaw-easy 2>&1 | while read line; do log "  $line"; done
        fi
        sleep 1
        rm -rf "$APP_DIR"
        mv "$APP_DIR_BAK" "$APP_DIR"
        if command -v supervisorctl &> /dev/null; then
            supervisorctl start openclaw-easy 2>&1 | while read line; do log "  $line"; done
        fi
    else
        # 从备份目录恢复
        local restore_items="server.js version.json package.json package-lock.json constants routes middleware utils state tasks docker public docs"
        for item in $restore_items; do
            if [ -e "$backup_dir/$item" ]; then
                cp -a "$backup_dir/$item" "$APP_DIR/" 2>/dev/null
                log "已恢复: $item"
            fi
        done

        cd "$APP_DIR" || return 1
        if command -v npm &> /dev/null && [ -f "package.json" ]; then
            log "重新安装依赖..."
            npm install --production --no-audit --no-fund 2>&1 | while read line; do log "  npm: $line"; done || true
        fi

        if command -v supervisorctl &> /dev/null; then
            supervisorctl restart openclaw-easy 2>&1 | while read line; do log "  $line"; done
        fi
    fi

    rm -f "$MARKER_FILE"
    rm -rf "$APP_DIR_BAK" 2>/dev/null
    log "========== 回滚完成 =========="
}

# ==================== 命令分发 ====================

case "$1" in
    update)
        main "$2"
        ;;
    rollback)
        rollback "$2"
        ;;
    status)
        if [ -f "$MARKER_FILE" ]; then
            echo "更新进行中"
            echo "备份目录: $(cat "$MARKER_FILE")"
        elif [ -d "$APP_DIR_BAK" ]; then
            echo "存在 bak 目录（上次更新可能未完成）"
            echo "bak: $APP_DIR_BAK"
        else
            echo "无进行中的更新"
        fi
        ;;
    formats)
        echo "支持的压缩格式:"
        for format in "${ARCHIVE_FORMATS[@]}"; do
            IFS='|' read -r fmt_ext fmt_tools fmt_cmd fmt_desc <<< "$format"
            local status="✓"
            for tool in $fmt_tools; do
                command -v "$tool" &> /dev/null || status="✗ 缺少: $tool"
            done
            printf "  %-12s %-30s %s\n" ".$fmt_ext" "$fmt_desc" "$status"
        done
        ;;
    clear-marker)
        rm -f "$MARKER_FILE"
        log "标记文件已清理"
        ;;
    *)
        echo "用法: $0 {update <URL>|rollback [备份目录]|status|formats|clear-marker}"
        echo ""
        echo "命令:"
        echo "  update <URL>        下载更新（同级目录+测试启动+mv切换）"
        echo "  rollback [备份目录]  回滚到备份版本"
        echo "  status              查看更新状态"
        echo "  formats             显示支持的压缩格式"
        echo "  clear-marker        清理更新标记文件"
        exit 1
        ;;
esac
