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

const TAG = new Date().toISOString().slice(2, 17).replace(/[-:T]/g, '').slice(0, 10);
const IMAGE_NAME = `baoboxs-nav-web:${TAG}`;

console.log(`镜像版本: ${IMAGE_NAME}\n`);

const conn = new Client();

conn.on('ready', async () => {
  console.log('SSH 连接成功\n');

  const commands = [
    `cd /data/projects/baoboxs-nav && docker build -t ${IMAGE_NAME} .`,
    `docker stop baoboxs-nav-web 2>/dev/null || true`,
    `docker rm baoboxs-nav-web 2>/dev/null || true`,
    `docker run -d --name baoboxs-nav-web --restart always -p 43000:3000 -e API_ENV=development -e API_BASE_URL=http://192.168.1.123:48080 ${IMAGE_NAME}`,
    `sleep 3 && curl -I http://localhost:43000`
  ];

  for (const cmd of commands) {
    await new Promise((resolve, reject) => {
      console.log(`> ${cmd.split('\n')[0].substring(0, 80)}...`);
      conn.exec(cmd, (err, stream) => {
        if (err) { reject(err); return; }
        let output = '';
        stream.on('close', () => {
          process.stdout.write(output);
          console.log('');
          resolve();
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          process.stderr.write(data.toString());
        });
      });
    });
  }

  console.log('\n✓ 部署完成');
  console.log(`访问地址: http://192.168.1.123:43000`);
  conn.end();
});

conn.on('error', (err) => {
  console.error('SSH 连接错误:', err.message);
});

console.log('正在连接 SSH...');
conn.connect(config);
