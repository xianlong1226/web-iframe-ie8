/* global __dirname: false */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const gulp = require('gulp');
const less = require('gulp-less');
const imagemin = require('gulp-imagemin');
const del = require('del');
const usemin = require('gulp-usemin');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const cleanCss = require('gulp-clean-css');
const rev = require('gulp-rev');
const minify = require('minify');
const async = require('async');

//图片和字体等文件的路径
let filePathObj = {};

function fileMd5(inputPath) {
    var hash = crypto.createHash('md5');
    var input = fs.readFileSync(inputPath);

    hash.update(input);
    var output = hash.digest('hex');

    return output;
}

function handleCssFile(cssText, cssPath){
    let fileArr = cssText.match(/url\s*\(\s*[\'\"]?(.*?)(?:[\'\"])?\s*\)/gi);
    if (!fileArr || fileArr.length === 0){
        return cssText;
    }

    fileArr.forEach(item => {
        let url = item.match(/url\s*\(\s*[\'\"]?(.*?)(?:[\'\"])?\s*\)/i)[1];
        if (url){
            let fullurl = path.join(cssPath, url);
            if (!filePathObj[fullurl]){
                let fileHash = fileMd5(fullurl);
                let dirPath = path.dirname(fullurl);
                let extName = path.extname(fullurl);
                let baseName = path.basename(fullurl, extName);

                let fileName = baseName + '-' + fileHash + extName;
                let publishDir = '';

                if (extName === '.jpg' || extName === '.jpeg' || extName === '.png' || extName === '.gif'){
                    publishDir = path.join(__dirname, 'tmp/images');
                    filePathObj[fullurl] = '/images/' + baseName + '-' + fileHash + extName;
                } else {
                    publishDir = path.join(__dirname, 'tmp/fonts');
                    filePathObj[fullurl] = '/fonts/' + baseName + '-' + fileHash + extName;
                }

                // 将文件写到发布目录中
                fs.writeFileSync(path.join(publishDir, fileName), fs.readFileSync(fullurl));
            }

            cssText = cssText.replace(url, filePathObj[fullurl]);
        }
    });

    return cssText;
}

function handleHtmlFile(htmlText, htmlPath){
    let fileArr = htmlText.match(/<img.*?(?:>|\/>)/gi);
    if (!fileArr || fileArr.length === 0){
        return htmlText;
    }

    fileArr.forEach(item => {
        let url = item.match(/src\s*=\s*[\'\"]?([^\'\"]*)[\'\"]?/i)[1];
        if (url){
            let fullurl = path.join(htmlPath, url);
            if (!filePathObj[fullurl]){
                let fileHash = fileMd5(fullurl);
                let dirPath = path.dirname(fullurl);
                let extName = path.extname(fullurl);
                let baseName = path.basename(fullurl, extName);

                let fileName = baseName + '-' + fileHash + extName;
                let publishDir = '';

                if (extName === '.jpg' || extName === '.jpeg' || extName === '.png' || extName === '.gif'){
                    publishDir = path.join(__dirname, 'tmp/images');
                    filePathObj[fullurl] = '/images/' + baseName + '-' + fileHash + extName;
                } else {
                    publishDir = path.join(__dirname, 'tmp/fonts');
                    filePathObj[fullurl] = '/fonts/' + baseName + '-' + fileHash + extName;
                }

                // 将文件写到发布目录中
                fs.writeFileSync(path.join(publishDir, fileName), fs.readFileSync(fullurl));
            }

            htmlText = htmlText.replace(url, filePathObj[fullurl]);
        }
    });

    return htmlText;
}

gulp.task('clean', function () {
    return del(['tmp', 'dist']);
});

// 首先在项目根目录下创建临时文件夹
gulp.task('mktmpdir', ['clean'], function(callback){
    fs.mkdirSync(path.join(__dirname, 'tmp'));
    fs.mkdirSync(path.join(__dirname, 'tmp/js'));
    fs.mkdirSync(path.join(__dirname, 'tmp/css'));
    fs.mkdirSync(path.join(__dirname, 'tmp/images'));
    fs.mkdirSync(path.join(__dirname, 'tmp/fonts'));

    return callback();
});

gulp.task('copy', ['mktmpdir'], function() {
    return gulp.src([
        '**',
        '!components',
        '!components/**',
        '!dist',
        '!dist/**',
        '!localsproxy',
        '!localsproxy/**',
        '!pages',
        '!pages/**',
        '!tmp',
        '!tmp/**',
        '!.babelrc',
        '!.eslintignore',
        '!.eslintrc.js',
        '!app.js',
        '!gulpfile.js',
        '!package*',
        '!webpack.*',
        '!node_modules',
        '!node_modules/**'
    ]).pipe(gulp.dest('tmp/'));
});

// 处理组件模块
gulp.task('handle-components', ['copy'], function(callback){
    let componentsRootPath = path.join(__dirname, './components');
    let distPath = path.join(__dirname, 'tmp/');

    let componentsjs = 'var components = {}; \n'; 
    let commonless = fs.readFileSync(path.join(__dirname, 'css/common.less'), 'utf8');

    // 处理css中的图片和字体路径
    commonless = handleCssFile(commonless, path.join(__dirname, 'css'));

    let components = fs.readdirSync(componentsRootPath);
    async.map(components, function(componentName, callback){
        try {
            // 当前组件中的js文件、data文件、css文件
            let js = fs.readFileSync(path.join(componentsRootPath, componentName, 'index.js'), 'utf8');
            let data = fs.readFileSync(path.join(componentsRootPath, componentName, 'data.json'), 'utf8');
            let css = fs.readFileSync(path.join(componentsRootPath, componentName, 'style.less'), 'utf8');

            // 处理css中的图片和字体路径
            css = handleCssFile(css, path.join(componentsRootPath, componentName));

            // 将组件中的css拼接到common.less
            commonless += '/** component ' + componentName + ' */\n' + css + '\n\n';

            // minify html
            minify(path.join(componentsRootPath, componentName, 'template.html'), function(err, template){
                // 处理html中的图片
                template = handleHtmlFile(template, path.join(componentsRootPath, componentName));

                // 替换组件js文件中的data.json引用和template.html引用
                js = js.replace(/require\(\s*'\.\/data.json'\s*\)/, data).replace(/require\(\s*'\.\/template.html'\s*\)/, '\'' + template + '\'');
                // 将组件包含到独立作用域中
                js = '/** component ' + componentName + ' */\n' + 'components.' + componentName + ' = function(){\n' + js + '\n};\n\n';

                // 将组件js拼接到components.js
                componentsjs += js;

                return callback(err, js);
            });
        } catch (ex){
            return callback(ex);
        }
    }, function(err, result){
        if (err){
            return callback(err, result);
        }

        fs.writeFileSync(path.join(distPath, 'js/components.js'), componentsjs, 'utf8');
        fs.writeFileSync(path.join(distPath, 'css/common.less'), commonless, 'utf8');

        return callback();
    });
});

// 处理页面
gulp.task('handle-pages', ['handle-components'], function(callback){
    let less = require('less');

    let pageRootPath = path.join(__dirname, './pages');
    let distPath = path.join(__dirname, 'tmp');

    let pages = fs.readdirSync(pageRootPath);
    async.map(pages, function(pageName, callback){
        try {
            let page = fs.readFileSync(path.join(pageRootPath, pageName, 'template.html'), 'utf8');
            let js = fs.readFileSync(path.join(pageRootPath, pageName, 'index.js'), 'utf8');
            let css = fs.readFileSync(path.join(pageRootPath, pageName, 'style.less'), 'utf8');
            let data = fs.readFileSync(path.join(pageRootPath, pageName, 'data.json'), 'utf8');

            if (!/<\/\s*head\s*>/.test(page)){
                return callback('no </head> found');
            } else if (!/<\/\s*body\s*>/.test(page)){
                return callback('no </body> found');
            }

            less.render(css, function(err, output){
                if (err){
                    return callback(err);
                }

                js = js.replace(/require\(\s*'\.\/data.json'\s*\)/, data);
                js = '<script type="text/javascript">\n' + js + '\n</script>\n';
                css = '<style>\n' + output.css + '\n</style>\n';

                // 处理css中的图片路径
                css = handleCssFile(css, path.join(pageRootPath, pageName));
                // 处理html中的图片路径
                page = handleHtmlFile(page, path.join(pageRootPath, pageName));

                page = page.replace(/<\/\s*head\s*>/, css + '</head>').replace(/<\/\s*body\s*>/, js + '</body>');

                fs.writeFileSync(path.join(distPath, pageName + '.html'), page, 'utf8');
                return callback();
            });
        } catch (ex){
            return callback(ex);
        }
    }, function(err, result){
        return callback(err, result);
    });
});

// 压缩图片
gulp.task('images', ['handle-pages'],function(){
    return gulp.src(['./tmp/images/**/*.png','./tmp/images/**/*.jpg','./tmp/images/**/*.jpeg','./tmp/images/**/*.gif'], { base: './tmp' })
        .pipe(imagemin())
        .pipe(gulp.dest('./dist'));
});

// copy fonts
gulp.task('fonts', ['images'], function(){
    return gulp.src(['./tmp/fonts/**/*'], { base: './tmp' })
        .pipe(gulp.dest('./dist'));
});

// copy vendors
gulp.task('vendors', ['fonts'], function(){
    return gulp.src(['./tmp/vendors/**/*'], { base: './tmp' })
        .pipe(gulp.dest('./dist'));
});

// 整合压缩html
gulp.task('minify', ['vendors'], function(){
    return gulp.src(['./tmp/*.html'], { base: './tmp' })
        .pipe(usemin({
            html: [ function(){ return htmlmin({ collapseWhitespace: true }); } ],
            css: [ less, rev ],
            js: [ uglify, rev ]
        }))
        .pipe(gulp.dest('./dist/'));
});

//develop
gulp.task('default', ['minify'], function(){
    let watcher = gulp.watch(['./pages', './js', './css', './images', './components', './vendors'],['minify']);

    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...'); // eslint-disable-line no-console
    });
});

//production
gulp.task('prod', ['minify']);