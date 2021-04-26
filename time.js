
"use strict";

var hand_names = [ "hour-hand", "minute-hand", "second-hand" ];


var twoTimes;

var time0_ms, time1_ms;

var gameMode = 0;

var currentPhrase;


var minutesGrouping = 1;

function generateMinutes() {
    console.log("MINUTE GROUPING: " + minutesGrouping);
    return (minutesGrouping * (getRandomInt(0, ((60/minutesGrouping)|0)-1, 'minute') | 0)) | 0;
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
var randomSets = {};
function getRandomInt(min, max, set) {
    if(set == null) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return (Math.floor(Math.random() * (max - min + 1)) + min) | 0;
    } else {
        console.log(set + " random int set gen - specified min " + min + " max " + max);
        var randomSet = randomSets[set];
        if(randomSet == null)
            randomSet = [];
        if(randomSet.length == 0) {
            for(var i = min; i <= max; i++) {
                randomSet.push(i|0);
            }
            shuffle(randomSet);
            console.log("generated set: [ " + randomSet.join() + " ]");
        }
        randomSets[set] = randomSet;
        var j = randomSet.pop();
        console.log("popped random number " + j);
        return j|0;
    }
    
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

$.fn.amPm = function(isPm) {
    var $am = $(this).find(".am-span");
    var $pm = $(this).find(".pm-span");
    if(isPm) {
        $am.css({ color: 'transparent' });
        $pm.css({ color: '' });
    } else {
        $am.css({ color: '' });
        $pm.css({ color: 'transparent' });
    }
};

$.fn.showAmPm = function(doShow) {
    if(doShow === undefined)
        doShow = true;
    if(doShow)
        $(this).find(".am-pm").show();
    else
        $(this).find(".am-pm").hide();
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
    
    h = (h % 12);
    if(h === 0)
        h = 12;
    m = (m % 60);
    $clock.setClockTime(h, m, 0);
}

var dates = {
    convert:function(d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year,d.month,d.date) :
            NaN
        );
    },
    compare:function(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=this.convert(a).valueOf()) &&
            isFinite(b=this.convert(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    },
    inRange:function(d,start,end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
       return (
            isFinite(d=this.convert(d).valueOf()) &&
            isFinite(start=this.convert(start).valueOf()) &&
            isFinite(end=this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
};

function timeComparison(time0, time1) {
    var date0 = new Date();
    var date1 = new Date();
    
    if(time0[2]) {
        if(time0[0] < 12) {
            time0[0] += 12;
        }
    } else if(time0[0] === 12) {
        time0[0] -= 12;
    }
    if(time1[2]) {
        if(time1[0] < 12) {
            time1[0] += 12;
        }
    } else if(time1[0] === 12) {
        time1[0] -= 12;
    }
   
    date0.setTime((time0[0] * 60 * 60 * 1000) + (time0[1] * 60 * 1000));
    date1.setTime((time1[0] * 60 * 60 * 1000) + (time1[1] * 60 * 1000));
    time0_ms = date0.getTime();
    time1_ms = date1.getTime();
    return dates.compare(date0, date1);
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
    $(".elapsed-time-p").hide();
    if(num === 0 || num === 1 || num === 3 || num === 5) {
        $("#first-clock").show();
    }
    
    
    if(num < 2)
        $("#clock-correct-answer").hide();
    else if(num < 4)
        $("#clock-correct-answer").show();
    else
        $("#clock-correct-answer").hide();
    if((num % 2) === 0)
        useDigital = false;
    else
        useDigital = true;
    
    if(num >= 2 && num < 4)
        $("#right-one").hide();
    else
        $("#right-one").show();
    
    
    if(!useDigital) {
        $("#first-clock").attr("data-readonly", "true");
        $targetClock = $("#first-clock");
        $answeredClock = $("#first-alarm-clock");
    } else if(useDigital) {
        $("#first-alarm-clock").attr("data-readonly", "true");
        $targetClock = $("#first-alarm-clock");
        $answeredClock = $("#first-clock");
    }
    
    if(num === 2 || num === 3) {
        currentPhrase = generateRandomTimePhrase();
        $(".time-phrase").text(currentPhrase[0]);
        if(!useDigital)
            $("#first-alarm-clock").show();
        else
            $("#first-clock").show();
    } else if(num < 4) {
        $targetClock.setClockTime(getRandomInt(1, 12), generateMinutes(), 0);
        $targetClock.show();
        $answeredClock.show();
    } else {
        var clockPortion;
        if(num === 5)
            clockPortion = "clock";
        else
            clockPortion = "alarm-clock";
        $(".elapsed-time-p").show();
        $(".elapsed-time-input").val("");
        $(".clock").attr("data-readonly", "true");
        $(".alarm-clock").attr("data-readonly", "true");
        twoTimes = [];
        for(var i = 0; i < 2; i++) {
            twoTimes[i] = [];
            twoTimes[i][0] = getRandomInt(1, 12);
            twoTimes[i][1] = generateMinutes();
            if(num === 5)
                twoTimes[i][2] = false;
            else
                twoTimes[i][2] = getRandomInt(0, 1) === 1 ? true : false; /* AM/PM */
            
        }
        
        console.log("Comparison: " + timeComparison(twoTimes[0], twoTimes[1]));
        if(timeComparison(twoTimes[0], twoTimes[1]) === 1) {
            var tmp = twoTimes[0];
            twoTimes[0] = twoTimes[1];
            twoTimes[1] = tmp;
            tmp = time0_ms;
            time0_ms = time1_ms;
            time1_ms = tmp;
        }
        for(var i = 0; i < 2; i++) {
            var $clock = $("#" + (i === 1 ? "second" : "first") + "-" + clockPortion);
            $clock.setClockTime(twoTimes[i][0], twoTimes[i][1]);
            $clock.amPm(twoTimes[i][2]);
        }
        if(num === 5) {
            $("." + clockPortion).show();
        } else {
            $("." + clockPortion).show();
        }
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


    var highlightedItems = document.querySelectorAll(".alarm-clock, .clock");

    highlightedItems.forEach(function(userItem) {
     observer.observe(userItem, {
      attributes: true //configure it to listen to attribute changes
     });
    });
    
    
    $("#second-clock").attr("data-readonly", "true");
    
    $("#second-alarm-clock").attr("data-readonly", "true");
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
            
            $clock.animateHand(n, angle/6, 0);
     
            
        
            var m = parseInt($clock.attr("data-minute"));
            
            var h = Math.round(((parseFloat($clock.attr("data-rot0")) / 5) - hourOffsetFromMinutes(m)) / 6);
            
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
    $("#first-clock").setClockTime(10, 10, 0);
    $("#first-alarm-clock").setClockTime(12, 0, 0);
    var isOn = true;
    var colonFlash = function() {
        if(isOn)
            $(".digital-colon").css({ opacity: '0' });
        else
            $(".digital-colon").css({ opacity: '1' });
        isOn = !isOn;
        setTimeout(colonFlash, 500);
    };
    $("#check-button").click(function() {
        var isCorrect = true;
        var ch, cm, ah, am;
        var elapsedTimeHours;
        var elapsedTimeMinutes;
        if(gameMode < 2) {
            ch = parseInt($targetClock.attr("data-hour"));
            cm = parseInt($targetClock.attr("data-minute"));
            ah = parseInt($answeredClock.attr("data-hour"));
            am = parseInt($answeredClock.attr("data-minute"));
        } else if(gameMode < 4) {
            ah = parseInt($answeredClock.attr("data-hour"));
            am = parseInt($answeredClock.attr("data-minute"));
            ch = currentPhrase[1][0];
            cm = currentPhrase[1][1];
            
        } else {
            if($("#elapsed-minutes").val().trim().length == 0) {
                $("#elapsed-minutes").val("0");
            }
            if($("#elapsed-hours").val().trim().length == 0) {
                $("#elapsed-hours").val("0");
            }
            ah = ch = parseInt($("#elapsed-hours").val());
            am = cm = parseInt($("#elapsed-minutes").val());
            if(ch === undefined || isNaN(ch) || cm === undefined || isNaN(cm))
                isCorrect = false;
            
            var ms = (ah * 60 * 60 * 1000) + (am * 60 * 1000);
            console.log("Time0_ms: " + time0_ms);
            console.log("Time1_ms: " + time1_ms);
            console.log("According to you, there was a " + ms);
            console.log("According to it, there was a " + (time1_ms - time0_ms));
            
            var ms = (ah * 60 * 60 * 1000) + (am * 60 * 1000);
            if(Math.round(time0_ms + ms) !== time1_ms) {
                isCorrect = false;
                var diff = (time1_ms - time0_ms);
                elapsedTimeHours = Math.trunc(diff / (60*60*1000));
                diff -= (elapsedTimeHours * 60 * 60 * 1000);
                elapsedTimeMinutes = Math.trunc(diff/1000/60);
            }
        }
        if(ah !== ch || am !== cm) {
            isCorrect = false;
        }
        $(".instrs").hide();
        $("#correct-" + isCorrect).show();
        if(!isCorrect) {
            $("#hour").text(ch);
            $("#minute").text(pad(cm, 2));
            var $clockToSet = null;
            if(gameMode === 1)
                $clockToSet = $("#first-clock");
            else if(gameMode == 0)
                $clockToSet = $("#first-alarm-clock");
            else if(gameMode >= 4) {
                $("#elapsed-hours").val(elapsedTimeHours);
                $("#elapsed-minutes").val(elapsedTimeMinutes);
            }
            if($clockToSet != null)
                $clockToSet.setClockTime(ch, cm, 0, 1000);
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
    $(".alarm-clock").amPm(true);
    colonFlash();
    $("#application").hide();
    $("#selector").show();
    $(window).resize();
});