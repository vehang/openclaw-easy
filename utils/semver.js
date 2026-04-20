/**
 * 轻量级 semver 工具（仅覆盖升级场景所需的比较功能）
 * 不引入外部依赖，支持 x.y.z 格式
 */

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function parse(v) {
    const m = SEMVER_RE.exec((v || '').trim());
    if (!m) return null;
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function valid(v) {
    return parse(v) !== null;
}

function gt(a, b) {
    const pa = parse(a);
    const pb = parse(b);
    if (!pa || !pb) return false;
    for (let i = 0; i < 3; i++) {
        if (pa[i] > pb[i]) return true;
        if (pa[i] < pb[i]) return false;
    }
    return false;
}

/**
 * 降序比较器，用于 Array.sort
 * [3.0.0, 2.5.0, 2.4.1, ...]
 */
function rcompare(a, b) {
    const pa = parse(a);
    const pb = parse(b);
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    for (let i = 0; i < 3; i++) {
        if (pa[i] > pb[i]) return -1;
        if (pa[i] < pb[i]) return 1;
    }
    return 0;
}

module.exports = { parse, valid, gt, rcompare };
