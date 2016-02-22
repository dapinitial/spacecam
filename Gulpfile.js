var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer'),
    server = require('gulp-express');

// Lint Task
gulp.task('lint', function() {
  return gulp.src('./html/js/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

// Compile Our Sass
gulp.task('sass', function() {
  return gulp.src('./html/scss/index.scss')
  .pipe(sass())
  .pipe(gulp.dest('./html/css'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
  return gulp.src('./html/js/*.js')
  .pipe(concat('all.js'))
  .pipe(gulp.dest('./html/js/dist'))
  .pipe(rename('all.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('./html/js/dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('./html/js/*.js', ['lint', 'scripts']);
  gulp.watch('./html/scss/*.scss', ['sass']);
});

// Express Task
gulp.task('express', function() {
  server.run(['app.js']);
});

// Compile assets only
gulp.task('compile', ['lint', 'sass', 'scripts']);

// Default Task
gulp.task('default', ['express', 'lint', 'sass', 'scripts', 'watch']);
