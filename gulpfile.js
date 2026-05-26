var gulp          = require('gulp');
var notify        = require('gulp-notify');
var source        = require('vinyl-source-stream');
var buffer        = require('vinyl-buffer');
var browserify    = require('browserify');
var babelify      = require('babelify');
var ngAnnotate    = require('browserify-ngannotate');
var browserSync   = require('browser-sync').create();
var rename        = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var uglify        = require('gulp-uglify');
var merge         = require('merge-stream');

// Where our files are located
var jsFiles   = "src/js/**/*.js";
var viewFiles = "src/js/**/*.html";

var interceptErrors = function(error) {
  var args = Array.prototype.slice.call(arguments);

  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);

  this.emit('end');
};

// Views Task
function views() {
  return gulp.src(viewFiles)
      .pipe(templateCache({
        standalone: true
      }))
      .on('error', interceptErrors)
      .pipe(rename("app.templates.js"))
      .pipe(gulp.dest('./src/js/config/'));
}

// Browserify Task
function browserifyTask() {
  return browserify('./src/js/app.js')
      .transform(babelify, { presets: ["es2015"] })
      .transform(ngAnnotate)
      .bundle()
      .on('error', interceptErrors)
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(gulp.dest('./build/'));
}

// HTML Task
function html() {
  return gulp.src("src/index.html")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/'));
}

// Production Build Task
function buildTask() {

  var htmlStream = gulp.src("build/index.html")
      .pipe(gulp.dest('./dist/'));

  var jsStream = gulp.src("build/main.js")
      .pipe(uglify())
      .pipe(gulp.dest('./dist/'));

  return merge(htmlStream, jsStream);
}

// Development Server
function serve() {

  browserSync.init({
    server: "./build",
    port: 4000,
    notify: false,
    ui: {
      port: 4001
    }
  });

  gulp.watch("src/index.html", html);
  gulp.watch(viewFiles, views);
  gulp.watch(jsFiles, gulp.series(views, browserifyTask));
}

// Register Tasks
gulp.task('views', views);

gulp.task(
  'browserify',
  gulp.series(views, browserifyTask)
);

gulp.task('html', html);

gulp.task(
  'build',
  gulp.series(
    gulp.parallel(
      html,
      gulp.series(views, browserifyTask)
    ),
    buildTask
  )
);

gulp.task(
  'default',
  gulp.series(
    gulp.parallel(
      html,
      gulp.series(views, browserifyTask)
    ),
    serve
  )
);
