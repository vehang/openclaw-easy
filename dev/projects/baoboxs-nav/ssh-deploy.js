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

const REMOTE_PROJECT_PATH = '/data/projects/baoboxs-nav';
const REGISTRY = '192.168.1.123:22345';
const IMAGE_NAME = 'baoboxs-nav';
const IMAGE_TAG = 'latest';

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
        // Try parent first
        const parent = path.posix.dirname(dir);
        if (parent === dir) {
          resolve(); // Root
        } else {
          mkdirp(sftp, parent).then(() => {
            sftp.mkdir(dir, (err) => resolve()); // Ignore error if exists
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

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`> ${cmd.split('\n')[0]}`);
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

    console.log('\n=== 执行远程构建和部署 ===');
    const commands = [
      `cd ${REMOTE_PROJECT_PATH} && docker build -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} .`,
      `docker stop baoboxs-nav-test 2>/dev/null || true`,
      `docker rm baoboxs-nav-test 2>/dev/null || true`,
      `docker run -d --name baoboxs-nav-test -p 3000:3000 -e API_ENV=test --restart unless-stopped ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}`,
      `sleep 5 && curl -f http://localhost:3000/api/health`
    ];

    try {
      for (const cmd of commands) {
        await runCommand(conn, cmd);
      }
      console.log('\n✓ 部署完成');
    } catch (e) {
      console.error('\n✗ 部署失败:', e.message);
    }

    conn.end();
  });
});

conn.on('error', (err) => {
  console.error('SSH 连接错误:', err.message);
});

console.log('正在连接 SSH...');
conn.connect(config);