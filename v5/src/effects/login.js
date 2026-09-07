
// 登录页Logo动效（通用版，支持多实例）

// 生成完整的Logo SVG HTML（包含defs、渐变、滤镜、玻璃路径、光晕层）
function createLogoSVG(prefix, width, height, brightness) {
  brightness = brightness || 1;
  var p = prefix;
  // 领域主题感知：书法领域用金色系渐变
  var isCalligraphy = (typeof cfg === 'function' && cfg('id') === 'calligraphy');
  var mainC0 = isCalligraphy ? '#ffd700' : '#409cff';
  var mainC1 = isCalligraphy ? '#d4a84b' : '#af52de';
  var subC0 = isCalligraphy ? '#fff8dc' : '#ff64aa';
  var subC1 = isCalligraphy ? '#e8c547' : '#64d2ff';
  var sparkC1 = isCalligraphy ? '#ffd700' : '#64d2ff';
  var glassFill = isCalligraphy ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.06)';
  var glassStroke = isCalligraphy ? 'rgba(232,197,71,0.7)' : 'rgba(255,255,255,0.25)';
  var paths = [
    'M243.31,288.55h42.82c4.49,0,8.71-2.18,11.31-5.84l115.29-162.35c3.26-4.59-0.02-10.95-5.65-10.95h-45.96c-6.74,0-13.06,3.26-16.96,8.76L234.83,272.12C229.94,279.01,234.86,288.55,243.31,288.55z',
    'M398.58,357.28h-49.56c-4.51,0-8.73-2.19-11.33-5.87l-36.66-51.92c-3.24-4.59,0.04-10.93,5.67-10.93h49.56c4.51,0,8.73,2.19,11.33,5.87l36.66,51.92C407.49,350.94,404.2,357.28,398.58,357.28z',
    'M586.1,178.14h-42.82c-4.49,0-8.71,2.18-11.31,5.84L416.67,346.33c-3.26,4.59,0.02,10.95,5.65,10.95h45.96c6.74,0,13.06-3.26,16.96-8.76l109.33-153.95C599.47,187.68,594.55,178.14,586.1,178.14z',
    'M430.83,109.41h49.56c4.51,0,8.73,2.19,11.33,5.87l36.66,51.92c3.24,4.59-0.04,10.93-5.67,10.93h-49.56c-4.51,0-8.73-2.19-11.33-5.87l-36.66-51.92C421.93,115.75,425.21,109.41,430.83,109.41z'
  ];

  var defs = '<defs>';
  for (var i = 1; i <= 4; i++) {
    defs += '<radialGradient id="' + p + 'Main' + i + '" cx="50%" cy="50%" r="75%">' +
      '<stop offset="0%" stop-color="' + mainC0 + '" stop-opacity="' + (0.45*brightness).toFixed(2) + '"/>' +
      '<stop offset="35%" stop-color="' + mainC1 + '" stop-opacity="' + (0.28*brightness).toFixed(2) + '"/>' +
      '<stop offset="65%" stop-color="' + mainC1 + '" stop-opacity="' + (0.08*brightness).toFixed(2) + '"/>' +
      '<stop offset="100%" stop-color="' + mainC1 + '" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + p + 'Sub' + i + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="' + subC0 + '" stop-opacity="' + (0.26*brightness).toFixed(2) + '"/>' +
      '<stop offset="40%" stop-color="' + subC1 + '" stop-opacity="' + (0.14*brightness).toFixed(2) + '"/>' +
      '<stop offset="100%" stop-color="' + subC1 + '" stop-opacity="0"/>' +
      '</radialGradient>';
  }
  defs += '<radialGradient id="' + p + 'SparkGrad" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>' +
    '<stop offset="40%" stop-color="' + sparkC1 + '" stop-opacity="0.8"/>' +
    '<stop offset="100%" stop-color="' + sparkC1 + '" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<filter id="' + p + 'SparkBlur" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feGaussianBlur stdDeviation="2.5"/>' +
    '</filter>' +
    '<filter id="' + p + 'BlurM" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="8"/>' +
    '</filter>' +
    '<filter id="' + p + 'BlurS" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="5"/>' +
    '</filter>' +
    '</defs>';

  var body = '';
  // 主光晕层
  for (var j = 0; j < 4; j++) {
    body += '<path d="' + paths[j] + '" class="' + p + 'm-' + (j+1) + '" fill="url(#' + p + 'Main' + (j+1) + ')" opacity="0.5"/>';
  }
  // 次光晕层
  for (var k = 0; k < 4; k++) {
    body += '<path d="' + paths[k] + '" class="' + p + 's-' + (k+1) + '" fill="url(#' + p + 'Sub' + (k+1) + ')" opacity="0.4"/>';
  }
  // 玻璃路径（可见形状+鼠标事件）
  for (var m = 0; m < 4; m++) {
    body += '<path d="' + paths[m] + '" class="login-glass" fill="' + glassFill + '" stroke="' + glassStroke + '" stroke-width="1.5"/>';
  }

  return '<svg viewBox="212.9 89.4 403.6 287.9" width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' + defs + body + '</svg>';
}

// 通用Logo特效初始化（呼吸、随机移动、鼠标跟随、颜色变化、边缘光点）
function initLogoEffect(svg, prefix) {
  if (!svg) return;
  var p = prefix || 'lg';
  var rgMains = [], rgSubs = [], glassPaths = [];
  for (var i = 1; i <= 4; i++) {
    rgMains.push(document.getElementById(p + 'Main' + i));
    rgSubs.push(document.getElementById(p + 'Sub' + i));
  }
  svg.querySelectorAll('path.login-glass').forEach(function(pp) { glassPaths.push(pp); });
  if (glassPaths.length === 0) return;

  var vb = svg.viewBox.baseVal;
  var vbX = vb.x, vbY = vb.y, vbW = vb.width, vbH = vb.height;
  var t = Math.random() * Math.PI * 2;
  var blocks = [];
  for (var bi = 0; bi < 4; bi++) {
    blocks.push({
      fx: 0.3 + Math.random() * 0.5, fy: 0.25 + Math.random() * 0.4,
      fx2: 0.1 + Math.random() * 0.2, fy2: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      breathSpeed: 0.012 + Math.random() * 0.004,
      breathPhase: bi * Math.PI / 2,
      hueSpeed: 0.4 + Math.random() * 0.3,
      huePhase: Math.random() * 360,
      cx: 50, cy: 50, mode: 'auto', targetCx: 50, targetCy: 50,
      flash: 0, flashCooldown: 100 + bi * 80 + Math.floor(Math.random() * 200),
      borderPhase: Math.random() * Math.PI * 2,
      borderSpeed: 0.04 + Math.random() * 0.06,
      borderDrift: Math.random() * 0.3
    });
  }

  var sparks = [], frameCount = 0, activeSparkCount = 0, MAX_SPARKS = 2, TRAIL_LENGTH = 1;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  for (var si = 0; si < 4; si++) {
    var trailEls = [];
    for (var ti = 0; ti < TRAIL_LENGTH; ti++) {
      var cc = document.createElementNS(SVG_NS, 'circle');
      cc.setAttribute('fill', 'url(#' + p + 'SparkGrad)');
      cc.setAttribute('filter', 'url(#' + p + 'SparkBlur)');
      cc.setAttribute('opacity', '0');
      svg.appendChild(cc);
      trailEls.push(cc);
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
      var pp = mouseToSvgPercent(e);
      blocks[idx].targetCx = pp.x; blocks[idx].targetCy = pp.y;
    });
    path.addEventListener('mousemove', function(e) {
      if (blocks[idx].mode === 'follow') {
        var pp = mouseToSvgPercent(e);
        blocks[idx].targetCx = pp.x; blocks[idx].targetCy = pp.y;
      }
    });
    path.addEventListener('mouseleave', function() { blocks[idx].mode = 'auto'; });
  });

  function animate() {
    t += 0.012;
    for (var ai = 0; ai < 4; ai++) {
      var b = blocks[ai];
      var breath = 0.5 + 0.5 * Math.sin(t * b.breathSpeed * 60 + b.breathPhase);
      var mainR = (40 + breath * 48).toFixed(1) + '%';
      var subR = (25 + breath * 35).toFixed(1) + '%';
      var glowOpacity = (0.03 + breath * 0.85);
      // 白色光晕随机闪现（缓慢柔和）
      if (b.flash > 0) {
        b.flash *= 0.985;
        glowOpacity = Math.min(1, glowOpacity + b.flash * 0.5);
      } else if (frameCount > b.flashCooldown && Math.random() < 0.0008) {
        b.flash = 1;
        b.flashCooldown = frameCount + 600 + Math.floor(Math.random()*900);
      }
      glowOpacity = glowOpacity.toFixed(2);
      if (b.mode === 'auto') {
        b.targetCx = 50 + Math.sin(t*b.fx+b.phase)*20 + Math.sin(t*b.fx2+b.phase*2)*8;
        b.targetCy = 50 + Math.cos(t*b.fy+b.phase*1.5)*18 + Math.cos(t*b.fy2+b.phase)*6;
        b.cx += (b.targetCx-b.cx)*0.04; b.cy += (b.targetCy-b.cy)*0.04;
      } else {
        b.cx += (b.targetCx-b.cx)*0.15; b.cy += (b.targetCy-b.cy)*0.15;
      }
      if (rgMains[ai]) { rgMains[ai].setAttribute('cx',b.cx.toFixed(2)+'%'); rgMains[ai].setAttribute('cy',b.cy.toFixed(2)+'%'); rgMains[ai].setAttribute('r',mainR); }
      if (rgSubs[ai]) { rgSubs[ai].setAttribute('cx',(b.cx+5).toFixed(2)+'%'); rgSubs[ai].setAttribute('cy',(b.cy-3).toFixed(2)+'%'); rgSubs[ai].setAttribute('r',subR); }
      var mainPath = svg.querySelector('.' + p + 'm-' + (ai+1));
      var subPath = svg.querySelector('.' + p + 's-' + (ai+1));
      if (mainPath) mainPath.style.opacity = glowOpacity;
      if (subPath) subPath.style.opacity = (parseFloat(glowOpacity)*0.8).toFixed(2);
      var isCallig = (typeof cfg === 'function' && cfg('id') === 'calligraphy');
      var hue = (t*b.hueSpeed*60+b.huePhase)%360;
      if (mainPath) mainPath.style.filter = (isCallig ? '' : 'hue-rotate('+hue.toFixed(0)+'deg) ') + 'url(#' + p + 'BlurM)';
      if (subPath) subPath.style.filter = (isCallig ? '' : 'hue-rotate('+hue.toFixed(0)+'deg) ') + 'url(#' + p + 'BlurS)';
      // 金色边框呼吸：跟人呼吸频率一致，固定最低浮现亮度
      var breathCycle = 0.5 + 0.5 * Math.sin(t * 1.6 + b.borderPhase);
      var borderOpacity = 0.5 + breathCycle * 0.5;
      var borderWidth = 1.5 + breathCycle * 0.5;
      var glassPath = svg.querySelectorAll('.login-glass')[ai];
      if (glassPath) {
        glassPath.style.strokeOpacity = borderOpacity.toFixed(2);
        glassPath.style.strokeWidth = borderWidth.toFixed(1);
      }
    }
    frameCount++;
    for (var sj = 0; sj < sparks.length; sj++) {
      var s = sparks[sj];
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
          for (var tk=0; tk<TRAIL_LENGTH; tk++) s.trailEls[tk].setAttribute('opacity','0');
        } else {
          var globalOp;
          if (s.progress<0.12) globalOp = s.progress/0.12;
          else if (s.progress>0.88) globalOp = (1-s.progress)/0.12;
          else globalOp = 1;
          for (var tl=0; tl<TRAIL_LENGTH; tl++) {
            var trailProgress = Math.max(0, s.progress-tl*s.baseSpeed*10);
            var len = (s.startOffset+trailProgress*s.pathLen*s.direction)%s.pathLen;
            if (len<0) len += s.pathLen;
            var pt2 = s.path.getPointAtLength(len);
            var sizeFactor = 1-tl/TRAIL_LENGTH;
            var pulse = 1+0.15*Math.sin(s.progress*Math.PI*6+sj);
            if (Math.random()<0.008) s.sparkle = 1;
            s.sparkle *= 0.92;
            var sparkleBoost = 1+s.sparkle*0.9;
            var sizeSparkle = 1+s.sparkle*0.35;
            s.trailEls[tl].setAttribute('cx',pt2.x.toFixed(1));
            s.trailEls[tl].setAttribute('cy',pt2.y.toFixed(1));
            s.trailEls[tl].setAttribute('r',(5.5*sizeFactor*pulse*sizeSparkle+0.8).toFixed(1));
            var flicker = 0.85+0.15*Math.sin(s.progress*Math.PI*11+sj*2.3);
            s.trailEls[tl].setAttribute('opacity',(globalOp*sizeFactor*flicker*sparkleBoost).toFixed(2));
          }
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// 登录页Logo初始化（兼容旧调用）
function initLoginLogo() {
  var svg = document.querySelector('.login-logo-svg');
  if (svg) initLogoEffect(svg, 'lg');
}

// 滚动模糊渐显动效
function initScrollReveal() {
  var vh = window.innerHeight;
  function update() {
    if (document.getElementById('appSidebar')) {
      document.body.setAttribute('data-reveal', '1');
      var els = document.querySelectorAll('.hero, section');
      for (var i = 0; i < els.length; i++) {
        els[i].style.filter = 'none';
        els[i].style.opacity = '1';
        els[i].style.transform = 'none';
      }
      return;
    }
    var scrollY = window.scrollY;
    var reveal = Math.min(1, Math.max(0, (scrollY - vh * 0.15) / (vh * 0.65)));
    document.body.setAttribute('data-reveal', reveal.toFixed(2));
    var blur = (18 * (1 - reveal)).toFixed(1);
    var opacity = (0.25 + 0.75 * reveal).toFixed(2);
    var translateY = (50 * (1 - reveal)).toFixed(1);
    var els2 = document.querySelectorAll('.hero, section');
    for (var j = 0; j < els2.length; j++) {
      els2[j].style.filter = reveal >= 0.98 ? 'none' : 'blur(' + blur + 'px)';
      els2[j].style.opacity = opacity;
      els2[j].style.transform = reveal >= 0.98 ? 'none' : 'translateY(' + translateY + 'px)';
    }
  }
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', function() { vh = window.innerHeight; update(); });
  update();
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

// 初始化登录页所有特效
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initLoginLogo();
    initScrollReveal();
    initNavHide();
  });
} else {
  initLoginLogo();
  initScrollReveal();
  initNavHide();
}
