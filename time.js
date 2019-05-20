/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var hand_names = [ "hour-hand", "minute-hand", "second-hand" ];


var gameMode = 0;

var currentPhrase;


var minutesGrouping = 1;

function generateMinutes() {
    return minutesGrouping * getRandomInt(0, (60/minutesGrouping)-1);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTimePhrase() {
    var str;
    var hour = getRandomInt(1, 12);
    var minute = generateMinutes();
    
    if(minute === 0) {
        str = writtenNumber(hour) + " o'clock";
    } else {
        function minute_str(minute) { return "minute" + ((minute === 1)) ? "" : "s"; }
        if(minute === 30) {
            str = "half past " + writtenNumber(hour);
        } else if(minute === 15) {
            str = "quarter past " + writtenNumber(hour);
        } else if(minute === 45) {
            str = "quarter to " + writtenNumber(hour);
            hour -= 1;
            if(hour === 0)
                hour = 12;
        } else if(minute < 30) {
            str = writtenNumber(minute) + " " + minute_str(minute) + " past " + writtenNumber(hour);
        } else if(minute > 30) {
            minute = 60 - minute;
            str = writtenNumber(minute) + " " + minute_str(minute) + " to " + writtenNumber(hour);
            minute = 60 - minute; /* restore */
            hour -= 1;
            if(hour === 0)
                hour = 12;
        }
    }
    
    return [ str, [hour, minute]];
}

var $answeredClock, $targetClock;


$.fn.animateRotate = function(angle, duration, easing, complete) {
    var args = $.speed(duration, easing, complete);
    var step = args.step;
    var n = hand_names.indexOf($(this).handId());

    var $clock;

    if($(this).hasClass("clock"))
        $clock = $(this);
    else
        $clock = $(this).parent();
    return this.each(function(i, e) {
      args.complete = $.proxy(args.complete, e);
      args.step = function(now) {
        $.style(e, 'transform', 'translateX(-50%) rotate(' + now + 'deg)');
        $clock.attr("data-rot" + n, now);
        if (step) return step.apply(e, arguments);
      };

      $({deg: parseFloat($clock.attr("data-rot" + n))}).animate({deg: angle}, args);
    });
};

$.fn.animateHand = function(id, second, duration) {
    var name = hand_names[id];
    if(duration === undefined)
        duration = 1000;
    $(this).find("." + name).animateRotate(second*6, duration, 'linear');
};

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

$.fn.once = function (events, callback) {
    return this.each(function () {
        var myCallback = function (e) {
            callback.call(this, e);
            $(this).off(events, myCallback);
        };
        $(this).on(events, myCallback);
    });
};

$.fn.handId = function() {
    if($(this).hasClass("hour-hand"))
        return "hour-hand";
    else if($(this).hasClass("minute-hand"))
        return "minute-hand";
    else if($(this).hasClass("second-hand"))
        return "second-hand";
    else
        throw "Undefined hand";
};

$.fn.setClockTime = function(hours, minutes, seconds, duration) {
    if(hours < 0 || hours > 99 || minutes < 0 || minutes > 99)
        return;
    
    
    if(duration === undefined)
        duration = 0;
    
    hours = (hours % 12);
    
    if(hours === 0)
        hours = 12;
    
    return this.each(function () {
        if($(this).attr("data-type") === "analog") {
            console.log("Minutes: " + minutes);
            $(this).animateHand(0, (hours * 5) + hourOffsetFromMinutes(minutes), duration);
            $(this).animateHand(1, minutes, duration);
            $(this).animateHand(2, seconds, duration);
        } else {
            var hours_str = pad(hours, 2);
            var minutes_str = pad(minutes, 2);
            $(this).find(".left-hour-digit").val(hours_str[0]);
            $(this).find(".right-hour-digit").val(hours_str[1]);
            $(this).find(".left-minute-digit").val(minutes_str[0]);
            $(this).find(".right-minute-digit").val(minutes_str[1]);
        }
        $(this).attr("data-hour", hours);
        $(this).attr("data-minute", minutes);
    });
};

function roundTo(n, x) {
    return x*Math.round(n/x);
}

function isAlphaNumeric(code) {
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  
  return true;
}

function limitText(limitField, limitNum) {
    if (limitField.value.length > limitNum) {
        limitField.value = limitField.value.substring(limitField.value.length - 1, limitField.value.length);
    } 
}

$.fn.setBorderPercentage = function(percent, border_side, coordinate) {
    if(border_side === undefined)
        border_side = "border";
    return this.each(function() {
        var el = $(this);
        var w;
        if(coordinate === undefined)
            w = el.outerWidth();
        else
            w = el[coordinate]();
        w *= (percent/100);
        w = w | 0; // calculate & trim decimals
        el.css(border_side + "-width", w + "px"); 
    });
    
};

$(window).resize(function() {
    $(".clock").setBorderPercentage(5);
    $(".clock-hand").setBorderPercentage(30, "border-top", 'outerHeight');
    $(".hour-hand").setBorderPercentage(50, "border-top", 'outerHeight');
    $(".alarm-clock").setBorderPercentage(5);
});


function ClockReadonly(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === "attributes") {
            var $clock = $(mutation.target);
            if($clock.hasClass("alarm-clock")) {
                if($clock.attr("data-readonly") === "true") {
                    $clock.find(".alarm-clock-digit").prop("disabled", "disabled");
                } else {
                    $clock.find(".alarm-clock-digit").removeProp("disabled");
                }
            }
        }
    });
}


function updateDigitalClock($clock) {
    var $left_hdigit = $clock.find(".left-hour-digit");
    var $right_hdigit = $clock.find(".right-hour-digit");
    var $left_mdigit = $clock.find(".left-minute-digit");
    var $right_mdigit = $clock.find(".right-minute-digit");
    
    var lh = parseInt($left_hdigit.val());
    var rh = parseInt($right_hdigit.val());
    var lm = parseInt($left_mdigit.val());
    var rm = parseInt($right_mdigit.val());
    
    if(lh === undefined || isNaN(lh))
        lh = 0;
    if(rh === undefined || isNaN(rh))
        rh = 0;
    if(lm === undefined || isNaN(lm))
        lm = 0;
    if(rm === undefined || isNaN(rm))
        rm = 0;
    
    var h = (lh * 10) + rh;
    var m = (lm * 10) + rm;
    
    console.log("Digital h: " + h + " m: " + m);
    h = (h % 12);
    if(h === 0)
        h = 12;
    m = (m % 60);
    $clock.setClockTime(h, m, 0);
}

function setupGameForMode(num) {
    var useDigital = false;
    gameMode = num;
    $(".instrs").hide();
    $("#mode-" + num + "-instrs").show();
    $(".clock").attr("data-readonly", "false");
    $(".clock").hide();
    $(".alarm-clock").hide();
    $(".alarm-clock").attr("data-readonly", "false");
    console.log("num is " + num);
    if(num === 0 || num === 1 || num === 3) {
        $("#first-clock").show();
    }
    
    
    if(num < 2)
        $("#clock-correct-answer").hide();
    else
        $("#clock-correct-answer").show();
    if((num % 2) === 0)
        useDigital = false;
    else
        useDigital = true;
    
    
    if(!useDigital) {
        $("#first-clock").attr("data-readonly", "true");
        $targetClock = $("#first-clock");
        $answeredClock = $("#first-digital-clock");
    } else if(useDigital) {
        $("#first-digital-clock").attr("data-readonly", "true");
        $targetClock = $("#first-digital-clock");
        $answeredClock = $("#first-clock");
    }
    
    if(num === 2 || num === 3) {
        currentPhrase = generateRandomTimePhrase();
        $(".time-phrase").text(currentPhrase[0]);
        if(!useDigital)
            $("#first-digital-clock").show();
        else
            $("#first-clock").show();
    } else {
        $targetClock.setClockTime(getRandomInt(1, 12), generateMinutes(), 0);
        $targetClock.show();
        $answeredClock.show();
    }
}

function backToSelector() {
    $("#application").hide();
    $("#selector").show();
}

function setCaretPosition(el, caretPos) {

    el.value = el.value;
    // ^ this is used to not only get "focus", but
    // to make sure we don't have it everything -selected-
    // (it causes an issue in chrome, and having it doesn't hurt any other browser)

    if (el !== null) {

        if (el.createTextRange) {
            var range = el.createTextRange();
            range.move('character', caretPos);
            range.select();
            return true;
        }

        else {
            // (el.selectionStart === 0 added for Firefox bug)
            if (el.selectionStart || el.selectionStart === 0) {
                el.focus();
                el.setSelectionRange(caretPos, caretPos);
                return true;
            }

            else  { // fail city, fortunately this never happens (as far as I've tested) :)
                el.focus();
                return false;
            }
        }
    }
}

function hourOffsetFromMinutes(m) {
    return (m / 12);
}

$(window).load(function() {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;


    var observer = new MutationObserver(ClockReadonly);

    observer.observe(document.querySelector(".alarm-clock"), {
      attributes: true //configure it to listen to attribute changes
    });
    $("#select-mode").click(function() {
        var $selected = $("input[name=size]:checked");
        var op = parseInt($selected.val());
        if(isNaN(op) || op === undefined)
            return;
        $selected = $("input[name=mg]:checked");
        var mg = parseInt($selected.val());
        if(isNaN(mg) || mg === undefined)
            return;
        minutesGrouping = mg;
        setupGameForMode(op);
        $("#selector").hide();
        $(".correct-text").hide();
        $("#done").hide();
        $("#next-button").prop("disabled", "disabled");
        $("#check-button").removeProp("disabled");
        $("#application").show();
        $(window).resize();
    });
    $(".clock-hand").on('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    $(".clock-hand").on('mousedown touchstart', function(e) {
        e.preventDefault();
        var $clock = $(this).parent();
        $("#test-mousedown").text("mousedown");
        if($clock.attr("data-readonly") !== "true" && $clock.attr("data-chd") === "null") {
            $clock.attr("data-chd", $(this).handId());
        }
    });
    $(".clock").on("mousemove touchmove", function(e) {
        var $clock = $(this);
        e.preventDefault();
        $("#test-mousemove").text("mousemove");
        if($clock.attr("data-readonly") !== "true" && $clock.attr("data-chd") !== "null") {
           
            var $el = $("#" + $clock.attr("data-chd"));
            var parentOffset = $(this).offset();
            var touchstruct;
            if (e.originalEvent.touches)
                touchstruct = e.originalEvent.touches[0];
            else
                touchstruct = e;
            var relX = touchstruct.pageX - parentOffset.left;
            var relY = touchstruct.pageY - parentOffset.top;
            
            var circleOffset = $(this).find(".clock-central-circle").position();
            
            relX -= circleOffset.left;
            relY -= circleOffset.top;
            relY = -relY;
            var angle = Math.atan(relX/relY) * (180/Math.PI);
            
            angle += 180;
            
            if(relY >= 0)
                angle += 180;
            
            var n = hand_names.indexOf($clock.attr("data-chd"));
            
            console.log("Moving: " + hand_names[n]);
            $clock.animateHand(n, angle/6, 0);
     
            
        
            var m = parseInt($clock.attr("data-minute"));
            
            var h = Math.round(((parseFloat($clock.attr("data-rot0")) / 5) - hourOffsetFromMinutes(m)) / 6);
            
            console.log("Hour is " + h);
            $clock.attr("data-hour", h);
            
            var prev_m = m;
            m = Math.round(parseFloat($clock.attr("data-rot1")) / 6);
            m = (m % 60);
            m = roundTo(m, minutesGrouping);
            
            
            $clock.attr("data-minute", m);
            $clock.setClockTime(h, m, 0);
            
        }
    });
    $(".clock-hand").add(".clock").on('mouseup touchend', function() {
        
        
        
        var $clock;
        if($(this).hasClass("clock")) {
            $clock = $(this);
        } else {
            $clock = $(this).parent();
        }
        $clock.attr("data-chd", "null");
    });
    $(".alarm-clock-digit").on('focusin click', function(e) {    
        this.setSelectionRange(0, 0);
        setCaretPosition(this, this.value.length);
    });
    
    
    $(".alarm-clock-digit").on('input', function(e) {
        console.log("Input event");
        var code = e.keyCode || e.which;

        
        if(this.value.length === 0) {
            $(this).val("0");
            updateDigitalClock($(this).parent().parent());
            return;
        }
        /*
        if(!isAlphaNumeric(code))
            return;
        
        
        if(this.value.length > 1)
            $(this).val(String.fromCharCode(code));
        */
       
        if(this.value.length > 1) {
           console.log("Constrain value to " + this.value[this.value.length - 1]);
           $(this).val(this.value[this.value.length - 1]);
        }
        
        if (this.value.length === 1) {
            var $next = $(this).parent().nextAll('.clock-digit').first().find('.alarm-clock-digit');
            if($(this).hasClass("left-hour-digit") && this.value === "1") {
                if(parseInt($next.val()) > 2) {
                    $next.val("0");
                }
            }
            if ($next.length)
                $next.focus();
            else {
                updateDigitalClock($(this).parent().parent());
                $(this).blur();
            }
        }
        updateDigitalClock($(this).parent().parent());
    });
    
    $(".alarm-clock-digit").each(function(i, current){
        setInterval(function() {
            if(this === document.activeElement)
                setCaretPosition(this, this.value.length);
        }, 25);   
    });
    $("#second-hand").hide();
    $(".clock").setClockTime(10, 10, 0);
    $(".alarm-clock").setClockTime(12, 0, 0);
    var isOn = true;
    var colonFlash = function() {
        if(isOn)
            $("#digital-colon").css({ opacity: '0' });
        else
            $("#digital-colon").css({ opacity: '1' });
        isOn = !isOn;
        setTimeout(colonFlash, 500);
    };
    $("#check-button").click(function() {
        var isCorrect = true;
        var ch, cm, ah, am;
        if(gameMode < 2) {
            ch = parseInt($targetClock.attr("data-hour"));
            cm = parseInt($targetClock.attr("data-minute"));
            ah = parseInt($answeredClock.attr("data-hour"));
            am = parseInt($answeredClock.attr("data-minute"));
        } else {
            ah = parseInt($answeredClock.attr("data-hour"));
            am = parseInt($answeredClock.attr("data-minute"));
            ch = currentPhrase[1][0];
            cm = currentPhrase[1][1];
            
        }
        if(ah !== ch || am !== cm) {
            isCorrect = false;
        }
        $(".instrs").hide();
        $("#correct-" + isCorrect).show();
        if(!isCorrect) {
            $("#hour").text(ch);
            $("#minute").text(pad(cm, 2));
            if(gameMode === 1)
                $(".clock").setClockTime(ch, cm, 0, 1000);
        }
        console.log("Is correct: " + isCorrect);
        $("#next-button").removeProp("disabled");
        $("#check-button").prop("disabled", "disabled");
        $(".clock").add(".alarm-clock").attr('data-readonly', 'true');
    });
    $(".correct-text").hide();
    $("#next-button").prop("disabled", "disabled");
    $("#next-button").click(function() {
        $(".correct-text").hide();
        setupGameForMode(gameMode);
        $("#check-button").removeProp("disabled");
        $("#next-button").prop("disabled", "disabled");
    });
    colonFlash();
    $("#application").hide();
    $("#selector").show();
    $(window).resize();
});