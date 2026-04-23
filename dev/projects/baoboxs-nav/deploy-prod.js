const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '192.168.1.123',
  port: 22345,
  username: 'root',
  password: 'Aa123456789#',
  readyTimeout: 30000
};

// 使用北京时间（东八区）
const TAG = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).replace(/[\/\s:]/g, '');

const IMAGE_NAME = `baoboxs-nav-web:${TAG}`;

console.log(`=== 按DEPLOY.md规范部署 ===`);
console.log(`镜像版本: ${IMAGE_NAME}\n`);

const UPLOAD_ITEMS = [
  '.next/standalone',
  '.next/static',
  'public',
  'Dockerfile'
];

function mkdirp(sftp, dir) {
  return new Promise((resolve, reject) => {
    sftp.mkdir(dir, (err) => {
      if (err) {
        const parent = path.posix.dirname(dir);
        if (parent === dir) {
          resolve();
        } else {
          mkdirp(sftp, parent).then(() => {
            sftp.mkdir(dir, (err) => resolve());
          });
        }
      } else {
        resolve();
      }
    });
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(localPath);
    const writeStream = sftp.createWriteStream(remotePath);
    readStream.pipe(writeStream);
    writeStream.on('close', resolve);
    writeStream.on('error', reject);
    readStream.on('error', reject);
  });
}

async function uploadItem(sftp, localPath, remotePath, baseLocal, baseRemote) {
  const stat = fs.statSync(localPath);
  const relativePath = path.relative(baseLocal, localPath);
  const remoteItemPath = path.posix.join(baseRemote, relativePath.split(path.sep).join('/'));

  if (stat.isDirectory()) {
    await mkdirp(sftp, remoteItemPath);
    const entries = fs.readdirSync(localPath);
    for (const entry of entries) {
      await uploadItem(sftp, path.join(localPath, entry), remoteItemPath, baseLocal, baseRemote);
    }
  } else {
    await mkdirp(sftp, path.posix.dirname(remoteItemPath));
    await uploadFile(sftp, localPath, remoteItemPath);
  }
}

const conn = new Client();

conn.on('ready', async () => {
  console.log('SSH 连接成功\n');

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('SFTP 错误:', err);
      conn.end();
      return;
    }

    console.log('=== 上传构建产物 ===');
    const REMOTE_PROJECT_PATH = '/data/projects/baoboxs-nav';
    await mkdirp(sftp, REMOTE_PROJECT_PATH);

    for (const item of UPLOAD_ITEMS) {
      const localPath = path.resolve(item);
      const remotePath = path.posix.join(REMOTE_PROJECT_PATH, item);

      console.log(`上传: ${item}...`);

      try {
        const stat = fs.statSync(localPath);
        if (stat.isDirectory()) {
          await mkdirp(sftp, remotePath);
          const entries = fs.readdirSync(localPath);
          for (const entry of entries) {
            await uploadItem(sftp, path.join(localPath, entry), remotePath, localPath, remotePath);
          }
        } else {
          await uploadFile(sftp, localPath, remotePath);
        }
        console.log(`  ✓ ${item}`);
      } catch (e) {
        console.error(`  ✗ ${item}:`, e.message);
      }
    }

    console.log('\n=== 远程构建和部署（严格按DEPLOY.md规范）===');
    
    const commands = [
      `cd ${REMOTE_PROJECT_PATH} && docker build --no-cache -t ${IMAGE_NAME} .`,
      `docker stop baoboxs-nav-web 2>/dev/null || true`,
      `docker rm baoboxs-nav-web 2>/dev/null || true`,
      `docker run -d --name baoboxs-nav-web --restart always -p 43000:3000 -e API_ENV=development -e API_BASE_URL=http://192.168.1.123:48080 ${IMAGE_NAME}`,
      `sleep 5 && curl -I http://localhost:43000`
    ];

    for (const cmd of commands) {
      await new Promise((resolve, reject) => {
        console.log(`\n> ${cmd.substring(0, 100)}...`);
        conn.exec(cmd, (err, stream) => {
          if (err) { reject(err); return; }
          let output = '';
          stream.on('close', () => {
            process.stdout.write(output);
            resolve();
          }).on('data', (data) => {
            output += data.toString();
          }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
          });
        });
      });
    }

    console.log('\n\n✓ 部署完成');
    console.log(`访问地址: http://192.168.1.123:43000`);
    conn.end();
  });
});

conn.on('error', (err) => {
  console.error('SSH 连接错误:', err.message);
});

console.log('正在连接 SSH...');
conn.connect(config);
