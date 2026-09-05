
// 登录页Logo动效（独立ID前缀lg-，避免与背景logo冲突）

// 滚动模糊渐显动效
function initScrollReveal() {
  var vh = window.innerHeight;
  function update() {
    var scrollY = window.scrollY;
    // 0 at top of login, 1 when scrolled past 80% of login screen
    var reveal = Math.min(1, Math.max(0, (scrollY - vh * 0.15) / (vh * 0.65)));
    document.body.setAttribute('data-reveal', reveal.toFixed(2));
    // Apply gradual blur/opacity/transform to hero and sections
    var blur = (18 * (1 - reveal)).toFixed(1);
    var opacity = (0.25 + 0.75 * reveal).toFixed(2);
    var translateY = (50 * (1 - reveal)).toFixed(1);
    var els = document.querySelectorAll('.hero, section');
    for (var i = 0; i < els.length; i++) {
      els[i].style.filter = reveal >= 0.98 ? 'none' : 'blur(' + blur + 'px)';
      els[i].style.opacity = opacity;
      els[i].style.transform = reveal >= 0.98 ? 'none' : 'translateY(' + translateY + 'px)';
    }
  }
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', function() { vh = window.innerHeight; update(); });
  update();
}

function initLoginLogo() {
  var svg = document.querySelector('.login-logo-svg');
  if (!svg) return;
  var rgMains = [], rgSubs = [], glassPaths = [];
  for (var i = 1; i <= 4; i++) {
    rgMains.push(document.getElementById('lgMain' + i));
    rgSubs.push(document.getElementById('lgSub' + i));
  }
  svg.querySelectorAll('path.login-glass').forEach(function(p) { glassPaths.push(p); });
  var vb = svg.viewBox.baseVal;
  var vbX = vb.x, vbY = vb.y, vbW = vb.width, vbH = vb.height;
  var t = Math.random() * Math.PI * 2;
  var blocks = [];
  for (var i = 0; i < 4; i++) {
    blocks.push({
      fx: 0.3 + Math.random() * 0.5, fy: 0.25 + Math.random() * 0.4,
      fx2: 0.1 + Math.random() * 0.2, fy2: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      breathSpeed: 0.012 + Math.random() * 0.004,
      breathPhase: i * Math.PI / 2,
      hueSpeed: 0.4 + Math.random() * 0.3,
      huePhase: Math.random() * 360,
      cx: 50, cy: 50, mode: 'auto', targetCx: 50, targetCy: 50
    });
  }
  var sparks = [], frameCount = 0, activeSparkCount = 0, MAX_SPARKS = 2, TRAIL_LENGTH = 1;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  for (var si = 0; si < 4; si++) {
    var trailEls = [];
    for (var ti = 0; ti < TRAIL_LENGTH; ti++) {
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('fill', 'url(#lgSparkGrad)');
      c.setAttribute('filter', 'url(#lgSparkBlur)');
      c.setAttribute('opacity', '0');
      svg.appendChild(c);
      trailEls.push(c);
    }
    sparks.push({
      trailEls: trailEls, path: glassPaths[si], pathLen: glassPaths[si].getTotalLength(),
      active: false, progress: 0, baseSpeed: 0.004,
      nextFrame: 600 + Math.floor(Math.random() * 600),
      direction: 1, startOffset: 0, sparkle: 0
    });
  }
  function mouseToSvgPercent(e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return {x:50,y:50};
    var svgPt = pt.matrixTransform(ctm.inverse());
    return {x:(svgPt.x-vbX)/vbW*100, y:(svgPt.y-vbY)/vbH*100};
  }
  glassPaths.forEach(function(path, idx) {
    path.addEventListener('mouseenter', function(e) {
      blocks[idx].mode = 'follow';
      var p = mouseToSvgPercent(e);
      blocks[idx].targetCx = p.x; blocks[idx].targetCy = p.y;
    });
    path.addEventListener('mousemove', function(e) {
      if (blocks[idx].mode === 'follow') {
        var p = mouseToSvgPercent(e);
        blocks[idx].targetCx = p.x; blocks[idx].targetCy = p.y;
      }
    });
    path.addEventListener('mouseleave', function() { blocks[idx].mode = 'auto'; });
  });
  function animate() {
    t += 0.012;
    for (var i = 0; i < 4; i++) {
      var b = blocks[i];
      var breath = 0.5 + 0.5 * Math.sin(t * b.breathSpeed * 60 + b.breathPhase);
      var mainR = (40 + breath * 48).toFixed(1) + '%';
      var subR = (25 + breath * 35).toFixed(1) + '%';
      var glowOpacity = (0.03 + breath * 0.85).toFixed(2);
      if (b.mode === 'auto') {
        b.targetCx = 50 + Math.sin(t*b.fx+b.phase)*20 + Math.sin(t*b.fx2+b.phase*2)*8;
        b.targetCy = 50 + Math.cos(t*b.fy+b.phase*1.5)*18 + Math.cos(t*b.fy2+b.phase)*6;
        b.cx += (b.targetCx-b.cx)*0.04; b.cy += (b.targetCy-b.cy)*0.04;
      } else {
        b.cx += (b.targetCx-b.cx)*0.15; b.cy += (b.targetCy-b.cy)*0.15;
      }
      if (rgMains[i]) { rgMains[i].setAttribute('cx',b.cx.toFixed(2)+'%'); rgMains[i].setAttribute('cy',b.cy.toFixed(2)+'%'); rgMains[i].setAttribute('r',mainR); }
      if (rgSubs[i]) { rgSubs[i].setAttribute('cx',(b.cx+5).toFixed(2)+'%'); rgSubs[i].setAttribute('cy',(b.cy-3).toFixed(2)+'%'); rgSubs[i].setAttribute('r',subR); }
      var mainPath = svg.querySelector('.lgm-'+(i+1));
      var subPath = svg.querySelector('.lgs-'+(i+1));
      if (mainPath) mainPath.style.opacity = glowOpacity;
      if (subPath) subPath.style.opacity = (parseFloat(glowOpacity)*0.8).toFixed(2);
      var hue = (t*b.hueSpeed*60+b.huePhase)%360;
      if (mainPath) mainPath.style.filter = 'hue-rotate('+hue.toFixed(0)+'deg) url(#lgBlurM)';
      if (subPath) subPath.style.filter = 'hue-rotate('+hue.toFixed(0)+'deg) url(#lgBlurS)';
    }
    frameCount++;
    for (var si = 0; si < sparks.length; si++) {
      var s = sparks[si];
      if (!s.active && frameCount >= s.nextFrame) {
        if (activeSparkCount < MAX_SPARKS) {
          s.active = true; s.progress = 0;
          s.baseSpeed = 0.003 + Math.random()*0.004;
          s.direction = Math.random()>0.5?1:-1;
          s.startOffset = Math.random()*s.pathLen;
          activeSparkCount++;
        } else {
          s.nextFrame = frameCount + 200 + Math.floor(Math.random()*300);
        }
      }
      if (s.active) {
        var easeFactor = 0.25 + 0.75*Math.sin(s.progress*Math.PI);
        s.progress += s.baseSpeed*easeFactor;
        if (s.progress >= 1) {
          s.active = false; activeSparkCount--;
          s.nextFrame = frameCount + 1500 + Math.floor(Math.random()*2100);
          for (var ti=0; ti<TRAIL_LENGTH; ti++) s.trailEls[ti].setAttribute('opacity','0');
        } else {
          var globalOp;
          if (s.progress<0.12) globalOp = s.progress/0.12;
          else if (s.progress>0.88) globalOp = (1-s.progress)/0.12;
          else globalOp = 1;
          for (var ti2=0; ti2<TRAIL_LENGTH; ti2++) {
            var trailProgress = Math.max(0, s.progress-ti2*s.baseSpeed*10);
            var len = (s.startOffset+trailProgress*s.pathLen*s.direction)%s.pathLen;
            if (len<0) len += s.pathLen;
            var pt = s.path.getPointAtLength(len);
            var sizeFactor = 1-ti2/TRAIL_LENGTH;
            var pulse = 1+0.15*Math.sin(s.progress*Math.PI*6+si);
            if (Math.random()<0.008) s.sparkle = 1;
            s.sparkle *= 0.92;
            var sparkleBoost = 1+s.sparkle*0.9;
            var sizeSparkle = 1+s.sparkle*0.35;
            s.trailEls[ti2].setAttribute('cx',pt.x.toFixed(1));
            s.trailEls[ti2].setAttribute('cy',pt.y.toFixed(1));
            s.trailEls[ti2].setAttribute('r',(5.5*sizeFactor*pulse*sizeSparkle+0.8).toFixed(1));
            var flicker = 0.85+0.15*Math.sin(s.progress*Math.PI*11+si*2.3);
            s.trailEls[ti2].setAttribute('opacity',(globalOp*sizeFactor*flicker*sparkleBoost).toFixed(2));
          }
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// 导航栏首屏隐藏逻辑
function initNavHide() {
  var nav = document.getElementById('topNav');
  if (!nav) return;
  function check() {
    if (window.scrollY < window.innerHeight * 0.5) {
      nav.classList.add('hidden-nav');
    } else {
      nav.classList.remove('hidden-nav');
    }
  }
  window.addEventListener('scroll', check, {passive:true});
  check();
}

