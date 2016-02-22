(function() {
  'use strict';

  var DROPBOX_CLIENT_KEY = '1m07w66d6okvwry',
      SEND_MMS_ENDPOINT = 'http://localhost:8080/sendMms',
      PIXEL_INTENSITY_CHANGE_THRESHOLD = 0.2,
      FRAME_INTENSITY_CHANGE_THRESHOLD = 0.2;

  var app = angular.module('app', ['ngStorage']);

  app.controller('controller', function ($scope, $localStorage, $sessionStorage, $http) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    $scope.getUserMediaSupported = !!navigator.getUserMedia;

    if (!$scope.getUserMediaSupported) {
      return;
    }

    $scope.localMediaStream = null;
    $scope.settings = $localStorage;
    $scope.settings.snapshotActions = $scope.settings.snapshotActions || { saveToDropbox: false, sendMms: false };

    var linkDropbox = function() {
      if ($scope.dropbox) {
        return;
      }

      (new Dropbox.Client({ key: DROPBOX_CLIENT_KEY })).authenticate(function(err, client) {
        if (err) {
          console.log(err);
          $scope.errorMessage = err;
          return;
        }

        client.getAccountInfo(function(err, accountInfo) {
          if (err) {
            console.log(err);
            $scope.errorMessage = err;
            return;
          }

          $scope.$apply(function() {
            $scope.dropboxAccountInfo = accountInfo;
          });
        });

        $scope.dropbox = client;
      });
    };

    $scope.unlinkDropbox = function() {
      if (!$scope.dropbox) {
        return;
      }

      $scope.dropbox.signOut(function() {
        $scope.$apply(function() {
          delete $scope.dropbox;
          $scope.settings.snapshotActions.saveToDropbox = false;
        });
      });
    };

    var saveToDropbox = function(imageBlob) {
      var filename = (new Date()).toISOString() + '.png';
      $scope.dropbox.writeFile(filename, imageBlob, function(err, stat) {
        if (err) {
          $scope.errorMessage = err;
          return;
        }

        console.log(stat);
      });
    };

    $scope.$watch('settings.snapshotActions.saveToDropbox', function(newValue, oldValue) {
      if (newValue && !$scope.dropbox) {
        linkDropbox();
      }
    });

    var sendMms = function(dataUrl) {
      if (!$scope.settings.carrier || !$scope.settings.number) {
        return;
      }

      $http.post(
        SEND_MMS_ENDPOINT,
        {
          carrier: $scope.settings.carrier,
          number: $scope.settings.number,
          dataUrl: dataUrl
        }
      ).then(function(response) {

      }, function(err) {
        $scope.errorMessage = 'Error sending MMS: ' + err.status;
      });
    };

    var video = $('video#cam')[0],
        buffer = $('canvas#buffer')[0],
        ctx = $('canvas#buffer')[0].getContext('2d'),
        currentSampleFrame = null,
        previousSampleFrame = null,
        sampleRate = 60, // sample rate in frames
        frameSinceLastSample = 0;

    var detectFrameChange = function(frame1, frame2) {
      var diff = 0;
      for (var i = 0; i < frame1.length; i += 4) {
        var r1 = frame1[i], g1 = frame1[i + 1], b1 = frame1[i + 2];
        var r2 = frame2[i], g2 = frame2[i + 1], b2 = frame2[i + 2];
        var i1 = 0.2989 * r1 + 0.5870 * g1 + 0.1140 * b1;
        var i2 = 0.2989 * r2 + 0.5870 * g2 + 0.1140 * b2;
        diff += Math.abs(i1 - i2) / 255 > PIXEL_INTENSITY_CHANGE_THRESHOLD;
      }

      return diff / (frame1.length / 4) > FRAME_INTENSITY_CHANGE_THRESHOLD;
    };

    var render = function() {
      ctx.drawImage(video, 0, 0);

      if (frameSinceLastSample++ > sampleRate) {
        previousSampleFrame = currentSampleFrame;
        currentSampleFrame = ctx.getImageData(0, 0, 640, 480).data;

        if (previousSampleFrame && currentSampleFrame && detectFrameChange(previousSampleFrame, currentSampleFrame)) {
          console.log('frame change detected');
          if ($scope.settings.autosave) {
            $scope.snapshot();
          }
        }

        frameSinceLastSample = 0;
      }

      requestAnimationFrame(render);
    };

    $scope.snapshot = function() {
      if ($scope.settings.snapshotActions.saveToDropbox) {
        buffer.toBlob(function(blob) {
          saveToDropbox(blob);
        });
      }

      if ($scope.settings.snapshotActions.sendMms) {
        sendMms(buffer.toDataURL());
      }
    };

    navigator.getUserMedia({
        audio: false,
        video: true
      },
      function(stream) {
        $scope.localMediaStream = stream;
        $('video#cam').attr('src', window.URL.createObjectURL($scope.localMediaStream));
        requestAnimationFrame(render);
      },
      function(err) {
        $scope.errorMessage = 'Error getting user media: ' + err;
      }
    );
  });
})();
!function(t){"use strict";var e=t.HTMLCanvasElement&&t.HTMLCanvasElement.prototype,o=t.Blob&&function(){try{return Boolean(new Blob)}catch(t){return!1}}(),n=o&&t.Uint8Array&&function(){try{return 100===new Blob([new Uint8Array(100)]).size}catch(t){return!1}}(),r=t.BlobBuilder||t.WebKitBlobBuilder||t.MozBlobBuilder||t.MSBlobBuilder,a=/^data:((.*?)(;charset=.*?)?)(;base64)?,/,i=(o||r)&&t.atob&&t.ArrayBuffer&&t.Uint8Array&&function(t){var e,i,l,u,b,c,d,B,f;if(e=t.match(a),!e)throw new Error("invalid data URI");for(i=e[2]?e[1]:"text/plain"+(e[3]||";charset=US-ASCII"),l=!!e[4],u=t.slice(e[0].length),b=l?atob(u):decodeURIComponent(u),c=new ArrayBuffer(b.length),d=new Uint8Array(c),B=0;B<b.length;B+=1)d[B]=b.charCodeAt(B);return o?new Blob([n?d:c],{type:i}):(f=new r,f.append(c),f.getBlob(i))};t.HTMLCanvasElement&&!e.toBlob&&(e.mozGetAsFile?e.toBlob=function(t,o,n){t(n&&e.toDataURL&&i?i(this.toDataURL(o,n)):this.mozGetAsFile("blob",o))}:e.toDataURL&&i&&(e.toBlob=function(t,e,o){t(i(this.toDataURL(e,o)))})),"function"==typeof define&&define.amd?define(function(){return i}):"object"==typeof module&&module.exports?module.exports=i:t.dataURLtoBlob=i}(window);
//# sourceMappingURL=canvas-to-blob.min.js.map
'use strict';

var DAP = window.DAP || {};

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

  /** Page Loader Initialization 
    */

  DAP.pageLoader();
  
  /** Navigation buttons
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


  $('.nav-button.manage').on({
    click: function() {
      $('html, body').animate({
       'scrollTop':   $('[name=manage]').offset().top
     }, 600);
    }
  });

   $('.nav-button.camera').on({
    click: function() {
      $('html, body').animate({
       'scrollTop':   $('[name=camera]').offset().top
     }, 600);
    }
  });

    $('.nav-button.settings').on({
    click: function() {
      $('html, body').animate({
       'scrollTop':   $('[name=settings]').offset().top
     }, 600);
    }
  });
   
  
  //removed for now
  /** Timeline
    */
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
  }
});

/** Save images to DropBox
  */

;(function() {
  'use strict';

  var DROPBOX_CLIENT_KEY = '1m07w66d6okvwry',
    SEND_MMS_ENDPOINT = 'http://localhost:4000/sendMms',
        PIXEL_INTENSITY_CHANGE_THRESHOLD = 0.2,
        FRAME_INTENSITY_CHANGE_THRESHOLD = 0.2;

  var app = angular.module('app', ['ngStorage']);

  app.controller('controller', function ($scope, $localStorage, $sessionStorage, $http) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    $scope.getUserMediaSupported = !!navigator.getUserMedia;

    if (!$scope.getUserMediaSupported) {
      return;
    }

    $scope.localMediaStream = null;
    $scope.settings = $localStorage;
    $scope.settings.snapshotActions = $scope.settings.snapshotActions || { saveToDropbox: false, sendMms: false };

    var linkDropbox = function() {
      if ($scope.dropbox) {
        return;
      }

      (new Dropbox.Client({ key: DROPBOX_CLIENT_KEY })).authenticate(function(err, client) {
        if (err) {
          console.log(err);
          $scope.errorMessage = err;
          return;
        }

        client.getAccountInfo(function(err, accountInfo) {
          if (err) {
            console.log(err);
            $scope.errorMessage = err;
            return;
          }

          $scope.$apply(function() {
            $scope.dropboxAccountInfo = accountInfo;
          });
        });

        $scope.dropbox = client;
      });
    };

    $scope.unlinkDropbox = function() {
      if (!$scope.dropbox) {
        return;
      }

      $scope.dropbox.signOut(function() {
        $scope.$apply(function() {
          delete $scope.dropbox;
          $scope.settings.snapshotActions.saveToDropbox = false;
        });
      });
    };

    var saveToDropbox = function(imageBlob) {
      var filename = (new Date()).toISOString() + '.png';
      $scope.dropbox.writeFile(filename, imageBlob, function(err, stat) {
        if (err) {
          $scope.errorMessage = err;
          return;
        }

        console.log(stat);
      });
    };

    $scope.$watch('settings.snapshotActions.saveToDropbox', function(newValue, oldValue) {
      if (newValue && !$scope.dropbox) {
        linkDropbox();
      }
    });

    var sendMms = function() {
      $http.post(
        SEND_MMS_ENDPOINT,
        {
          carrier: '',
          number: ''
        }
      ).then(function(response) {

      }, function(err) {
        $scope.errorMessage = 'Error sending MMS: ' + err.status;
      });
    };

    var video = $('video#cam')[0],
        buffer = $('canvas#buffer')[0],
        ctx = $('canvas#buffer')[0].getContext('2d'),
        currentSampleFrame = null,
        previousSampleFrame = null,
        sampleRate = 60, // sample rate in frames
        frameSinceLastSample = 0;

    var detectFrameChange = function(frame1, frame2) {
      var diff = 0;
      for (var i = 0; i < frame1.length; i += 4) {
        var r1 = frame1[i], g1 = frame1[i + 1], b1 = frame1[i + 2];
        var r2 = frame2[i], g2 = frame2[i + 1], b2 = frame2[i + 2];
        var i1 = 0.2989 * r1 + 0.5870 * g1 + 0.1140 * b1;
        var i2 = 0.2989 * r2 + 0.5870 * g2 + 0.1140 * b2;
        diff += Math.abs(i1 - i2) / 255 > PIXEL_INTENSITY_CHANGE_THRESHOLD;
      }

      return diff / (frame1.length / 4) > FRAME_INTENSITY_CHANGE_THRESHOLD;
    };

    var render = function() {
      ctx.drawImage(video, 0, 0);

      if (frameSinceLastSample++ > sampleRate) {
        previousSampleFrame = currentSampleFrame;
        currentSampleFrame = ctx.getImageData(0, 0, 640, 480).data;

        if (previousSampleFrame && currentSampleFrame && detectFrameChange(previousSampleFrame, currentSampleFrame)) {
          console.log('frame change detected');
          if ($scope.settings.autosave) {
            $scope.snapshot();
          }
        }

        frameSinceLastSample = 0;
      }

      requestAnimationFrame(render);
    };

    $scope.snapshot = function() {
      buffer.toBlob(function(blob) {
        if ($scope.settings.snapshotActions.saveToDropbox) {
          saveToDropbox(blob);
        }

        if ($scope.settings.snapshotActions.sendMms) {
          sendMms(blob);
        }
      });
    };

    navigator.getUserMedia({
        audio: false,
        video: true
      },
      function(stream) {
        $scope.localMediaStream = stream;
        $('video#cam').attr('src', window.URL.createObjectURL($scope.localMediaStream));
        requestAnimationFrame(render);
      },
      function(err) {
        $scope.errorMessage = 'Error getting user media: ' + err;
      }
    );
  });
})();

// jshint ignore: start

/**
 * StyleFix 1.0.3 & PrefixFree 1.0.7
 * @author Lea Verou
 * MIT license
 */
(function(){function k(a,b){return[].slice.call((b||document).querySelectorAll(a))}if(window.addEventListener){var e=window.StyleFix={link:function(a){try{if("stylesheet"!==a.rel||a.hasAttribute("data-noprefix"))return}catch(b){return}var c=a.href||a.getAttribute("data-href"),d=c.replace(/[^\/]+$/,""),h=(/^[a-z]{3,10}:/.exec(d)||[""])[0],l=(/^[a-z]{3,10}:\/\/[^\/]+/.exec(d)||[""])[0],g=/^([^?]*)\??/.exec(c)[1],m=a.parentNode,f=new XMLHttpRequest,n;f.onreadystatechange=function(){4===f.readyState&&
n()};n=function(){var b=f.responseText;if(b&&a.parentNode&&(!f.status||400>f.status||600<f.status)){b=e.fix(b,!0,a);if(d)var b=b.replace(/url\(\s*?((?:"|')?)(.+?)\1\s*?\)/gi,function(b,a,c){return/^([a-z]{3,10}:|#)/i.test(c)?b:/^\/\//.test(c)?'url("'+h+c+'")':/^\//.test(c)?'url("'+l+c+'")':/^\?/.test(c)?'url("'+g+c+'")':'url("'+d+c+'")'}),c=d.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g,"\\$1"),b=b.replace(RegExp("\\b(behavior:\\s*?url\\('?\"?)"+c,"gi"),"$1");c=document.createElement("style");c.textContent=
b;c.media=a.media;c.disabled=a.disabled;c.setAttribute("data-href",a.getAttribute("href"));m.insertBefore(c,a);m.removeChild(a);c.media=a.media}};try{f.open("GET",c),f.send(null)}catch(p){"undefined"!=typeof XDomainRequest&&(f=new XDomainRequest,f.onerror=f.onprogress=function(){},f.onload=n,f.open("GET",c),f.send(null))}a.setAttribute("data-inprogress","")},styleElement:function(a){if(!a.hasAttribute("data-noprefix")){var b=a.disabled;a.textContent=e.fix(a.textContent,!0,a);a.disabled=b}},styleAttribute:function(a){var b=
a.getAttribute("style"),b=e.fix(b,!1,a);a.setAttribute("style",b)},process:function(){k('link[rel="stylesheet"]:not([data-inprogress])').forEach(StyleFix.link);k("style").forEach(StyleFix.styleElement);k("[style]").forEach(StyleFix.styleAttribute)},register:function(a,b){(e.fixers=e.fixers||[]).splice(void 0===b?e.fixers.length:b,0,a)},fix:function(a,b,c){for(var d=0;d<e.fixers.length;d++)a=e.fixers[d](a,b,c)||a;return a},camelCase:function(a){return a.replace(/-([a-z])/g,function(b,a){return a.toUpperCase()}).replace("-",
"")},deCamelCase:function(a){return a.replace(/[A-Z]/g,function(b){return"-"+b.toLowerCase()})}};(function(){setTimeout(function(){k('link[rel="stylesheet"]').forEach(StyleFix.link)},10);document.addEventListener("DOMContentLoaded",StyleFix.process,!1)})()}})();
(function(k){function e(b,c,d,h,l){b=a[b];b.length&&(b=RegExp(c+"("+b.join("|")+")"+d,"gi"),l=l.replace(b,h));return l}if(window.StyleFix&&window.getComputedStyle){var a=window.PrefixFree={prefixCSS:function(b,c,d){var h=a.prefix;-1<a.functions.indexOf("linear-gradient")&&(b=b.replace(/(\s|:|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig,function(b,a,c,d){return a+(c||"")+"linear-gradient("+(90-d)+"deg"}));b=e("functions","(\\s|:|,)","\\s*\\(","$1"+h+"$2(",b);b=e("keywords","(\\s|:)","(\\s|;|\\}|$)",
"$1"+h+"$2$3",b);b=e("properties","(^|\\{|\\s|;)","\\s*:","$1"+h+"$2:",b);if(a.properties.length){var l=RegExp("\\b("+a.properties.join("|")+")(?!:)","gi");b=e("valueProperties","\\b",":(.+?);",function(a){return a.replace(l,h+"$1")},b)}c&&(b=e("selectors","","\\b",a.prefixSelector,b),b=e("atrules","@","\\b","@"+h+"$1",b));b=b.replace(RegExp("-"+h,"g"),"-");return b=b.replace(/-\*-(?=[a-z]+)/gi,a.prefix)},property:function(b){return(0<=a.properties.indexOf(b)?a.prefix:"")+b},value:function(b,c){b=
e("functions","(^|\\s|,)","\\s*\\(","$1"+a.prefix+"$2(",b);b=e("keywords","(^|\\s)","(\\s|$)","$1"+a.prefix+"$2$3",b);0<=a.valueProperties.indexOf(c)&&(b=e("properties","(^|\\s|,)","($|\\s|,)","$1"+a.prefix+"$2$3",b));return b},prefixSelector:function(b){return b.replace(/^:{1,2}/,function(b){return b+a.prefix})},prefixProperty:function(b,c){var d=a.prefix+b;return c?StyleFix.camelCase(d):d}};(function(){var b={},c=[],d=getComputedStyle(document.documentElement,null),h=document.createElement("div").style,
l=function(a){if("-"===a.charAt(0)){c.push(a);a=a.split("-");var d=a[1];for(b[d]=++b[d]||1;3<a.length;)a.pop(),d=a.join("-"),StyleFix.camelCase(d)in h&&-1===c.indexOf(d)&&c.push(d)}};if(0<d.length)for(var g=0;g<d.length;g++)l(d[g]);else for(var e in d)l(StyleFix.deCamelCase(e));var g=0,f,k;for(k in b)d=b[k],g<d&&(f=k,g=d);a.prefix="-"+f+"-";a.Prefix=StyleFix.camelCase(a.prefix);a.properties=[];for(g=0;g<c.length;g++)e=c[g],0===e.indexOf(a.prefix)&&(f=e.slice(a.prefix.length),StyleFix.camelCase(f)in
h||a.properties.push(f));!("Ms"!=a.Prefix||"transform"in h||"MsTransform"in h)&&"msTransform"in h&&a.properties.push("transform","transform-origin");a.properties.sort()})();(function(){function b(a,b){h[b]="";h[b]=a;return!!h[b]}var c={"linear-gradient":{property:"backgroundImage",params:"red, teal"},calc:{property:"width",params:"1px + 5%"},element:{property:"backgroundImage",params:"#foo"},"cross-fade":{property:"backgroundImage",params:"url(a.png), url(b.png), 50%"}};c["repeating-linear-gradient"]=
c["repeating-radial-gradient"]=c["radial-gradient"]=c["linear-gradient"];var d={initial:"color","zoom-in":"cursor","zoom-out":"cursor",box:"display",flexbox:"display","inline-flexbox":"display",flex:"display","inline-flex":"display",grid:"display","inline-grid":"display","max-content":"width","min-content":"width","fit-content":"width","fill-available":"width"};a.functions=[];a.keywords=[];var h=document.createElement("div").style,e;for(e in c){var g=c[e],k=g.property,g=e+"("+g.params+")";!b(g,k)&&
b(a.prefix+g,k)&&a.functions.push(e)}for(var f in d)k=d[f],!b(f,k)&&b(a.prefix+f,k)&&a.keywords.push(f)})();(function(){function b(a){e.textContent=a+"{}";return!!e.sheet.cssRules.length}var c={":read-only":null,":read-write":null,":any-link":null,"::selection":null},d={keyframes:"name",viewport:null,document:'regexp(".")'};a.selectors=[];a.atrules=[];var e=k.appendChild(document.createElement("style")),l;for(l in c){var g=l+(c[l]?"("+c[l]+")":"");!b(g)&&b(a.prefixSelector(g))&&a.selectors.push(l)}for(var m in d)g=
m+" "+(d[m]||""),!b("@"+g)&&b("@"+a.prefix+g)&&a.atrules.push(m);k.removeChild(e)})();a.valueProperties=["transition","transition-property"];k.className+=" "+a.prefix;StyleFix.register(a.prefixCSS)}})(document.documentElement);
