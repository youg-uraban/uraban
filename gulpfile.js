//プラグイン読み込み
var gulp = require('gulp'),
    del = require('del'),
    plumber = require('gulp-plumber'),
	sass = require('gulp-ruby-sass'),
	pleeease = require('gulp-pleeease'),
	cssmin = require('gulp-cssmin'),
	rename = require('gulp-rename'),
    concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
    ejs = require('gulp-ejs'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    runSequence = require('run-sequence'),
    mainBowerFiles= require('main-bower-files'),
    spritesmith = require('gulp.spritesmith');

//bowerファイル格納
var files = mainBowerFiles();

//パスの設定
var path = {
    root: 'dist/',
    sass: 'asset/sass/',
    css: 'asset/css/',
    cssmin: 'dist/asset/css/',
    js: 'asset/js/',
    jsmin: 'dist/asset/js/',
    lib: 'asset/lib/',
    libmin: 'dist/asset/lib/',
    ejs: 'asset/ejs/',
    img: 'asset/img/',
    imgmin: 'dist/asset/img/',
    sprite: 'asset/img/sprite/',
    tmp: 'asset/tmp/'
}

//------------------------------------------------------
//削除処理
//------------------------------------------------------
//一時ファイルの削除
gulp.task("clean", function () {
    del([path.tmp]);
});

//------------------------------------------------------
//CSSの処理
//------------------------------------------------------
//Sass
gulp.task('sass',function(){
    return sass(path.sass + '**/*.scss',{
        style : 'expanded',
        'sourcemap=none': true,
        compass: true
    })
    .pipe(plumber())
    .pipe(pleeease({
        autoprefixer: {
            'browsers': ['last 4 versions', 'Firefox ESR', 'ie 8', 'Safari 4', 'Android 2.3', 'iOS 4']
        },
        rem: ['10px'],
        minifier: false,
        mqpacker: true
    }))
    .pipe(gulp.dest(path.css));
});

//CSS圧縮
gulp.task('cssmin', function () {
    return gulp.src(path.css + '**/*.css')
    .pipe(plumber())
    .pipe(cssmin())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(path.cssmin));
});

//CSSの処理をまとめる
gulp.task('css', function(callback) {
    console.log('--------- CSSを処理します ----------');
    return runSequence('sass','cssmin',callback);
});

//------------------------------------------------------
//JavaScriptの処理
//------------------------------------------------------
//JavaScript連結
gulp.task('concat', function() {
    return gulp.src([path.js + '**/*.js'])
    .pipe(plumber())
    .pipe(concat('common.js'))
    .pipe(gulp.dest(path.tmp));
});

//JavaScript圧縮
gulp.task('uglify', function() {
    return gulp.src([path.tmp + '**/common.js'])
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(path.jsmin));
});

//JavaScriptの処理をまとめる
gulp.task('js', function(callback) {
    console.log('--------- JavaScriptを処理します ----------');
    return runSequence('concat','uglify','clean',callback);
});

//------------------------------------------------------
//HTMLの処理
//------------------------------------------------------
//ejs
gulp.task('ejsBuild', function() {
    return gulp.src([path.ejs + '**/*.ejs','!' + path.ejs + '**/_*.ejs'])
    .pipe(plumber())
    .pipe(ejs({}, {ext: '.html'}))
    .pipe(gulp.dest(path.root));
});

//エラーした場合ゴミejsを削除
gulp.task('ejsClean', function () {
    del([path.root + '**/*.ejs']);
});

//ejsの処理をまとめる
gulp.task('ejs', function(callback) {
    console.log('--------- ejsをHTMLに変換します ----------');
    return runSequence('ejsBuild','ejsClean',callback);
});

//------------------------------------------------------
//画像の処理
//------------------------------------------------------
//画像圧縮
gulp.task('imagemin', function() {
    return gulp.src([path.img + '**/*.+(jpg|jpeg|png|gif|svg)','!' + path.sprite + '**/*.png'])
    .pipe(plumber())
    .pipe(imagemin({
        progressive: true,
        use: [pngquant({quality: '65-80', speed: 1})]
    }))
    .pipe(gulp.dest(path.imgmin));
});

//画像の処理をまとめる
gulp.task('img', function(callback) {
    console.log('--------- 画像を処理します ----------');
    return runSequence('imagemin',callback);
});

//------------------------------------------------------
//スプライトの処理
//------------------------------------------------------
gulp.task('spriteBuild', function () {
    var spriteData = gulp.src(path.sprite + '**/*.png')
    .pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: '_sprite.scss',
        imgPath: '../img/sprite.png',
        cssFormat: 'scss',
        cssOpts: {
            functions: false
        },
        cssVarMap: function (sprite) {
            sprite.name = 'sprite-' + sprite.name;
        }
    }));
    spriteData.img.pipe(gulp.dest(path.img));
    spriteData.css.pipe(gulp.dest(path.sass));
});

//スプライトの処理をまとめる
gulp.task('sprite', function(callback) {
    console.log('--------- 画像を処理します ----------');
    return runSequence('spriteBuild','sass',['cssmin','imagemin'],callback);
});

//------------------------------------------------------
//ライブラリの処理
//------------------------------------------------------
//ライブラリの連結
gulp.task('bowerConcat', function() {
	return gulp.src(files)
    .pipe(plumber())
    .pipe(concat('bower_components.js'))
    .pipe(gulp.dest(path.tmp))
});

//ライブラリの圧縮
gulp.task('bowerUglify', function() {
    return gulp.src([path.tmp + '**/bower_components.js'])
    .pipe(plumber())
    .pipe(uglify({
        preserveComments: 'some'
    }))
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(path.lib))
    .pipe(gulp.dest(path.libmin));
});

//ライブラリの処理をまとめる
gulp.task('bower', function(callback) {
    console.log('--------- ライブラリを処理します ----------');
    return runSequence('bowerConcat','bowerUglify','clean',callback);
});

//------------------------------------------------------
//タスクの監視
//------------------------------------------------------
//監視
gulp.task('watch', function() {
    gulp.watch((path.sass + '**/*.scss'), ['css']);
    gulp.watch((path.js + '**/*.js'), ['js']);
    gulp.watch((path.ejs + '**/*.ejs'), ['ejs']);
    gulp.watch((path.img + '**/*.+(jpg|jpeg|png|gif|svg)'), ['img']);
    gulp.watch((path.sprite + '**/*.png'), ['sprite']);
});
gulp.task('default', ['watch']);