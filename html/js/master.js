'use strict';

var DAP = window.DAP || {},
    owl = $('.owl-carousel');

DAP.pageLoader = function() {
  var $elements = $('body').find('img[src]');
  $('body [style]').each(function() {
    var src = $(this).css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    if (src && src != 'none') {
      $elements = $elements.add($('<img src="' + src + '"/>'));
    }
  });

  var $loading = $('#loader-container');
  var $loadPercentageLine = $('#loader-percentage-line');
  var $loadPercentageText = $('#loader-percentage');
  var elementsLoaded = 0;
  var speed = 1000;

  function animatePercentage(e) {
    $loadPercentageText.text(parseInt(e));
  }

  function loading() {
    var percentage = 0;
    if ($elements.length) {
      percentage = parseInt((elementsLoaded / $elements.length) * 100);
    }

    $loadPercentageLine.stop().animate({
      height: percentage + '%'
    }, speed);

    $loading.stop().animate({
      percentage: percentage
    }, {
      duration: speed,
      step: animatePercentage
    });
  }

  function loadingFinish() {
    var percentage = 100;

    $loadPercentageLine.stop().animate({
      height: percentage + '%'
    }, (speed / 2));

    $loading.stop().animate({
        percentage: percentage
      }, {
        duration: (speed / 2),
        step: animatePercentage
      })
      .css({
        opacity: 1
      }).animate({
        opacity: 0
      }, function() {
        $loading.css({
          display: 'none'
        });
        $('.wrapper').css({
          opacity: 0,
          visibility: 'visible'
        }).animate({
          opacity: 1
        });
      });
  }

  if ($elements.length) {
    loading();

    $elements.load(function() {
      $(this).off('load');
      elementsLoaded++;
      loading();
    });
  }

  $(window).load(function() {
    loadingFinish();
  });
};

$(document).ready(function() {
  DAP.pageLoader();
  $('article').on({
    click: function() {
      $('.piece').toggleClass('flipped');
    }
  });
  owl.owlCarousel({
    touchDrag: false,
    mouseDrag : false,
    items: 1,
    loop: true,
    onInitialize: function() {
      console.log('carousel initialized');
    },
    startPosition: '#settings',
    URLhashListener: true
  });
  
  /** navigation
    */
  $('.nav-button').on({
    click: function() {
      var self = $(this);    
      if (self.hasClass('active')) {
        self.toggleClass('active');
        self.siblings().removeClass('active');
      } else {
        self.siblings().removeClass('active');
        self.addClass('active');
      }
    }
  });
  
  //removed for now
  /*
  $('#timeline .commit').click(function() {
    var self = $(this);
    if (self.hasClass('active')) {
      self.removeClass('active'); 
    } else {
      self.siblings().removeClass('active');
      self.addClass('active');
    }
  });
  */
});

$(window).on({
  resize: function(){
    console.log('window resized');
    // owl resize refresh code needs to go here
    /** owl refresh code
    */
    owl.trigger('refresh.owl.carousel')
  }
});
