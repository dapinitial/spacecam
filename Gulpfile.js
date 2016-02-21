var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer');

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
  var express = require('express');
  var app = express();
  app.use(express.static(__dirname + '/html'));
  app.listen(8080, '0.0.0.0');
  console.log('What happens on 8080 stays on 8080');
});

// Default Task
gulp.task('default', ['express', 'lint', 'sass', 'scripts', 'watch']);
