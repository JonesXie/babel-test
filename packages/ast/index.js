const babel = require("@babel/core");
const types = require("@babel/types");
// const arrowTransform = require("@babel/plugin-transform-arrow-functions");
const arrowTransform = {
  visitor: {
    ArrowFunctionExpression(path) {
      if (!path.isArrowFunctionExpression()) return;
      const { node } = path;
      node.type = "FunctionExpression";

      // 变量提升
      hoistFunction(path);

      if (!types.isBlockStatement(node.body)) {
        node.body = types.blockStatement([types.returnStatement(node.body)]);
      }
    },
  },
};

// 功能：变量提升
const hoistFunction = (path) => {
  // 获取当前函数的父环境
  const parentEnv = path.findParent(
    (parent) =>
      (parent.isFunction() && !parent.isArrowFunctionExpression()) ||
      parent.isProgram()
  );

  // 定义一个变量，用于存放this
  const bingingThis = "_this";

  // 获取this表达式的路径
  const thisPaths = getThisPath(path);

  // 遍历thisPaths，将this表达式替换为bingingThis
  thisPaths.forEach((thisPath) => {
    thisPath.replaceWith(types.identifier(bingingThis));
  });

  // 将bingingThis添加到父环境的作用域中
  parentEnv.scope.push({
    id: types.identifier(bingingThis),
    init: types.thisExpression(),
  });
};

// 功能：获取This表达式的路径
const getThisPath = (path) => {
  // 定义一个空数组，用于存放路径
  let arr = [];
  // 遍历path
  path.traverse({
    // 如果是This表达式
    ThisExpression(path) {
      // 将路径添加到arr中
      arr.push(path);
    },
  });
  // 返回arr
  return arr;
};

// const code = `const sum = (a,b)=> a + b`;
const code = `function a(){const sum =()=> console.log(this)}`;

// 使用babel转换代码，并传入arrowTransform插件
const result = babel.transformSync(code, {
  plugins: [arrowTransform],
});

// 打印转换后的代码
console.log(result.code);
