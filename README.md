# web-iframe-ie8
通过gulp+knockoutjs搭建的前端模块化开发框架

# 1. 运行
### 首先，执行 npm install 
### 其次，执行 gulp 对静态资源进行编译
### 最后，执行 node app.js 启动服务

# 2. 目录介绍
## 1> components目录里每一个文件夹都是一个组件，最终所有的组件会被编译到components.js中。
#### data.json中的内容最后会替换index.js中的require('./data.json')。
#### template.html中的内容最后会替换index.js中的require('./template.html')。
##### template.html中如果需要引入图片，路径要以"./images/"开头。
#### style.less中的内容最后会被编译到common.less中。
##### style.less中如果需要引入图片，路径要以"../images/"开头。
#### index.js中的内容最后会被包裹一层函数（函数名就是该组件名）并编译到components.js中。

## 2> css目录存放所有的css文件，里面必须包含一个common.less文件
##### css文件中如果需要引入图片，路径要以"../images"开头。
## 3> js目录存放公共的js文件
## 4> images目录存放所有的图片
## 5> fonts目录存放所有的字体文件
## 6> pages目录里每一个文件夹对应一个页面,该目录下所有文件中需要引入静态资源的地方都要以"./"开头
#### data.json中的内容最后会替换index.js中的require('./data.json')。
#### style.less中的内容最后会被编译到template.html的\<head>\</head>中。
##### style.less中如果需要引入图片，路径要以"./images/"开头。
#### index.js中的内容最后会被编译到template.html的\<body>\</body>中。
#### template.html最后会被重命名为当前文件夹的名称并成为最后的html文件。
##### template.html中如果需要引入图片，路径要以"./images/"开头。

## 3> vendors目录中存放第三方的插件

# 3. app.js文件
这个文件里配置的是页面上ajax请求转发的地址。

# 4. gulpfile.js文件
这个文件里的内容是执行打包编译操作的，最好不要改变，除非你认为改变后更适合你的项目开发。