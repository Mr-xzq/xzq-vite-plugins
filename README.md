# 开发指南

## 模块相关

1. `fs-extra`这种包目前只支持`common js module`, 不能原生支持`es module`,
   因此我们导入的时候尽量不要使用`import { xx } from 'fs-extra'`这种具名导入,
   而是使用`import fs from 'fs-extra';`
   这种默认导入的方式, 后者兼容性更好, `node`也能支持;

## 导入文件路径

1. 导入文件路径尽量不要忽略后缀名, 而是输入全部的路径, 比如: `import xx from 'to/demo.js'`,
   而不要 `import xx from 'to/demo'`, 防止奇怪的异常;

## 开发可执行脚本

1. 配置 `package.json --> bin: xx.js` 之后, 然后通过打包工具就会生成对应环境的可执行文件, 但是这里要注意的是,
   在 `bin: xx.js` 中支持的模块标准是根据`package.json --> type: 'commonjs | module'` 来的, 默认情况下是: `commonjs`,
   因此默认情况下 `bin: xx.js` 中就不能写 `es module` 语法, 如果想要支持, 可以声明 `package.json --> type: 'module'`;
