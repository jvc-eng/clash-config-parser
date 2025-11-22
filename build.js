const fs = require('fs');
const path = require('path');

console.log('开始构建过程...');

// 确保 dist 目录存在
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('创建 dist 目录');
}

// 复制必要的文件
const filesToCopy = [
  { from: 'src/index.html', to: 'index.html' },
  { from: 'functions', to: 'functions' }
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file.from)) {
    // 这里可以添加文件复制逻辑
    console.log(`找到文件: ${file.from}`);
  }
});

console.log('构建完成！');
