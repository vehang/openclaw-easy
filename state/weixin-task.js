/**
 * 微信登录任务管理
 * 
 * 全局变量：控制微信登录进程（SSE 和 QR API 共享）
 */

// 当前微信登录任务
let currentWeixinTask = null;  // { taskId, childProcess, pid, startTime, startedBy }

function getCurrentWeixinTask() {
    return currentWeixinTask;
}

function setCurrentWeixinTask(task) {
    currentWeixinTask = task;
}

function clearCurrentWeixinTask() {
    currentWeixinTask = null;
}

module.exports = {
    getCurrentWeixinTask,
    setCurrentWeixinTask,
    clearCurrentWeixinTask
};
