// -*- Mode: c++; c-basic-offset: 4; -*- // hrmph, no javaspit mode in emacs ...
/* Code to check the self-referential aptitude test.
 *
 * The code in this file encodes Jim Propp's self-referential aptitude
 * test (see srat-Q.html); such intellectual property rights as attach
 * to the semantics thereof as encoded here belong to him.  The latter
 * parts of InitInputs() are a derivative work based on code contributed
 * by Ian Hickson; all else is copyright (c) 2005 Edward Welbourne, who
 * did it as an exercise in learning JavaSpit (so you should not expect
 * this to be exemplary code) and is more than happy to see it used,
 * improved or adapted by whosoever will.  See srat-Q.html for contact
 * details for the assorted authors.
 *
 * $Id: srat-Q.js,v 1.11 2010-07-17 15:31:12 eddy Exp $
 */
function Prepare() {
    InitInputs();
    InitChecks();
}

var Questions = []; // [ , Question( li, 1 ), ..., Question( li, 20 ) ]
var Ranges = []; // [ Unset, [ Amin, Amax ], ..., [ Emin, Emax ] ]

function InitInputs() {
    function Question(li, ind) {
	this.li = li;
	li.id = 'Q' + ind;
	this.index = ind;
	Questions[ind] = this;
	this.ans = [];
	this.given = null;
	return this;
    }
    Question.prototype = new Object;
    Question.prototype.setState = function (state) { this.li.className = state; };
    Question.prototype.select = function (radio) {
	if (this.given != radio) {
	    if (this.given != null)
		this.clear();
	    this.given = radio;
	    Ranges[0].value--;
	    for (var i = 5; i > 0; i--)
		if (this.ans[i] == radio)
		    Ranges[i][0].value++;
		else if (!this.ans[i].disabled)
		    Ranges[i][1].value--;
	}
	if (this.checking.checked)
	    this.setState(this.check());
    };
    Question.prototype.clear = function () {
	if (this.given != null) {
	    this.given.checked = false;
	    for (var i = 5; i > 0; i--)
		if (this.ans[i] == this.given)
		    Ranges[i][0].value--;
		else if (!this.ans[i].disabled)
		    Ranges[i][1].value++;

	    this.given = null;
	    Ranges[0].value++;
	}
	this.setState('');
    }
    Question.prototype.forbid = function (on, radio) {
	if (on) {
	    if (radio.checked) this.clear();
	    if (!radio.disabled && this.given == null) {
		Ranges[radio.value][1].value--;
	    }
	} else if (radio.disabled && this.given == null) {
	    Ranges[radio.value][1].value++;
	}
	radio.disabled = on;
    }

    function countingToggle() {
	var box = document.getElementById('counting');
	var counts = document.getElementById('count');
	box.onclick = function (event) {
	    if (box.checked) {
		counts.className = '';
	    } else {
		counts.className = 'cheat';
	    }
	};
	return box;
    }
    Question.prototype.counting = countingToggle();

    function getChecker() {
	var box = document.getElementById('checking');
	box.onclick = function (event) {
	    // nothing to do ...
	    if (box.checked) {
		var Q = Questions[20];
		Q.setState(Q.check());
	    } else
		for (var i = 20; i > 0; i--)
		    Questions[i].setState('');
	};
	return box;
    };
    Question.prototype.checking = getChecker();
    document.getElementById('cheat').className = '';

    // Can't inline this, or next: local variable scopes would change !
    function radioCheck(radio, question) {
	return function (event) {
	    if (radio.checked)
		question.select(radio);
	    else if (radio == question.checked)
		question.clear();
	};
    }

    // The rest of this functon is based on code kindly contributed by Hixie:
    function boxCheck(checkbox, radio, question) {
	return function (event) {
	    question.forbid(checkbox.checked, radio);
	};
    }

    var inputs = document.getElementsByTagName('input');
    var Q = null; // Current question
    var iQ = 20; // Next question number
    var iA; // Next answer number
    var iR = 0; // Next Range

    // Final input is the reset button, so we can afford to i-- immediately.
    for (var i = inputs.length; i-- > 0; ) {
        var radio = inputs[i]; // not always a radio button, in fact
	if (radio.type == 'radio') {
	    var aQ = radio.parentNode.parentNode.parentNode;
	    if (Q == null || aQ != Q.li) {
		Q = new Question(aQ, iQ--);
		iA = 5;
	    }

	    radio.name = Q.li.id;
	    Q.ans[iA] = radio;
	    radio.value = iA--;
	    radio.id = 'R' + Q.index + radio.value; // not yet in use
	    // radio.onchange = function (event) { Questions[20].setState('wrong'); }; // doesn't happen !!
	    radio.onclick = radioCheck(radio, Q);
	    /* Assume that every radio button on the page is preceeded
	     * by a checkbox, with which we want to pair it: */
	    var checkbox = inputs[i-1];
	    checkbox.onchange = checkbox.onclick = boxCheck(checkbox, radio, Q);
	    /* (note that the "click" event fires whenever the
	     * checkbox is activated, not only when it is clicked) */
	    i--; /* skip past previous control since we know it isn't a
		  * radio and is thus irrelevant */
	} else if (radio.type == 'text') {
	    radio.size = 2;
	    radio.readOnly = true;
	    if (iR == 0) { // unset counter
		radio.value = 20;
		Ranges[0] = radio;
		iR = 5;
	    } else if (Ranges[iR]) { // lower bound
		radio.value = 0;
		Ranges[iR--][0] = radio;
	    } else { // upper bound
		radio.value = 20;
		Ranges[iR] = [, radio];
	    }
	}
    }
}

// Set up check functions encoding each question's predicate:

function InitCountChecks() {
    function CheckCount(ans, low, high, off) {
	if (low > off + 4 || high < off) return 'wrong';

	var fail = 'dodgy';
	for (var i = 0; i++ < 5; ) {
	    if (ans[i].checked)
		return (low > i + off - 1 || high < i + off - 1) ? 'wrong'
		    : (high != low) ? 'maybe' : 'right';
	    else if (!ans[i].disabled && low < off + i && high >= i + off - 2)
		fail = '';
	}
	return fail;
    }

    Questions[3].check = function () {
	return CheckCount(this.ans, Ranges[5][0].value - 0, Ranges[5][1].value - 0, 0);
    };

    Questions[4].check = function () {
	return CheckCount(this.ans, Ranges[1][0].value - 0, Ranges[1][1].value - 0, 4);
    };

    Questions[8].check = function () {
	var yes = 0;
	var maybe = 0;
	for (var i in Questions) {
	    var Q = Questions[i];
	    if (Q.ans[1].checked || Q.ans[5].checked)
		yes++;
	    else if (Q.given == null && !(Q.ans[1].disabled && Q.ans[5].disabled)) {
		if (Q.ans[2].disabled && Q.ans[3].disabled && Q.ans[4].disabled)
		    yes++; // vowel allowed, nothing else allowed
		else
		    maybe++;
	    }
	}
	return CheckCount(this.ans, yes, yes + maybe, 4);
    };

    Questions[11].check = function () {
	var yes = 0;
	var maybe = 0;
	for (var i = 0; i++ < 10;) {
	    if (Questions[i].ans[2].checked)
		yes++;
	    else if (Questions[i].given == null && !Questions[i].ans[2].disabled)
		maybe++;
	}
	return CheckCount(this.ans, yes, yes + maybe, 0);
    };

    Questions[14].check = function () {
	return CheckCount(this.ans, Ranges[4][0].value - 0, Ranges[4][1].value - 0, 6);
    };

    Questions[18].check = function () {
	if (this.given == null) return '';

	var A = Ranges[1][0].value - 0;
	var mayA = Ranges[1][1].value - A;

	var same = this.given.value - 0 + 1;
	if (same > 5) {
	    // <sigh> none of the above </sigh>
	    var safe = 0;
	    var blur = mayA;
	    for (var i = 1; ++i < 5;) {
		var pair = Ranges[i];
		var yes = pair[0].value - 0;
		var maybe = pair[1].value - yes;
		if (A + mayA < yes || A > yes + maybe)
		    safe++;
		else if (maybe)
		    blur += maybe;
		else if (!mayA)
		    return 'wrong';
	    }
	    return (safe == 4 || blur == 0) ? 'right' : 'dodgy';
	} else {
	    var pair = Ranges[same];
	    var yes = pair[0].value - 0;
	    var maybe = pair[1].value - yes;
	    return (A + mayA < yes || A > yes + maybe) ? 'wrong'
		: (mayA || maybe) ? 'maybe' : 'right';
	}
    };
}

function InitPermutes() {
    function CheckPermute(chosen, other, permute) {
	if (chosen == null) return '';
	var it = permute[chosen];
	return (other.ans[it].checked) ? 'right'
	    : (other.given != null) ? 'wrong'
	    : (other.ans[it].disabled) ? 'dodgy'
	    : 'maybe';
    }

    Questions[10].check = function () {
	return CheckPermute(this.given == null ? null : this.given.value,
			    Questions[16], [,4,1,5,2,3]);
    }
    Questions[16].check = function () {
	return CheckPermute(this.given == null ? null : this.given.value,
			    Questions[10], [,4,3,2,1,5]);
    }
    Questions[15].check = function () {
	return CheckPermute(this.given == null ? null : this.given.value,
			    Questions[12], [,1,2,3,4,5]);
    }
}

function InitChecks() {
    InitCountChecks(); // 3, 4, 8, 11, 14, 18
    InitPermutes(); // 10, 15, 16

    Questions[1].check = function () {
	var known = true;
	for (var i = 0; i++ < 5;) {
	    if (Questions[i].ans[2].disabled) {
		if (this.ans[i].checked)
		    return 'wrong';
	    } else if (Questions[i].given == null)
		known = false;
	    else if (Questions[i].given.value == 2) {
		return (this.ans[i].checked)
		    ? (known ? 'right' : '')
		    : (this.given == null && !this.ans[i].disabled)
		    ? '' : 'wrong';
	    } else if (this.ans[i].checked) {
		return known ? 'wrong' : 'dodgy';
	    }
	}
	return (this.given == null || !known) ? '' : 'dodgy';
    };

    Questions[2].check = function () {
	var lo = 0;
	var vague = false;
	var last = Questions[20].given;
	for (var i = 20; i-- > 1;) { // we care about the order in this check
	    var here = Questions[i].given;
	    if (last == null || here == null)
		vague = true;
	    else if (last.value == here.value) {
		if (i > 10 || i < 6 || lo)
		    return 'wrong';
		lo = i;
	    }
	    last = here;
	}
	if (this.given == null) {
	    return '';
	} else if (lo) {
	    return (this.ans[lo - 5] != this.given) ? 'wrong' : (vague) ? 'maybe' : 'right';
	} else {
	    for (var i = 0; i++ < 5; ) {
		if (this.ans[i] == this.given) lo = i + 5;
	    }
	    return (Questions[lo].given == null ||
		    Questions[1+lo].given == null) ? '' : 'wrong';
	}
    };

    Questions[5].check = function () {
	var maybe = false;
	for (var i = 0; i++ < 5; ) {
	    if (this.ans[i] == this.given) {
		return (Questions[i].given == Questions[i].ans[i]) ? 'right'
		    : (Questions[i].given != null) ? 'wrong'
		    : (Questions[i].ans[i].disabled) ? 'dodgy'
		    : 'maybe';
	    }
	    if (Questions[i].given == Questions[i].ans[i] ||
		(Questions[i].given == null && !Questions[i].ans[i].disabled))
		maybe = true;
	}
	return (!maybe) ? 'wrong' : (this.given == null) ? '' : 'maybe';
    };

    Questions[6].check = Questions[17].check = function () {
	if (this.given == null) return '';
	var me = this.given.value - 0;

	var that = Questions[(this.index == 6) ? 17 : 6];
	if (that.given == null)
	    return (me < 4 && that.ans[me+2].disabled) ? 'dodgy'
		: (me == 4 && that.ans[1].disabled && that.ans[2].disabled) ? 'dodgy'
		: (me == 5) ? 'dodgy'
		: '';

	var it =  that.given.value - 0;
	return (it == 2+me || (me == 4 && it < 3)) ? 'right' : 'wrong';
    };

    Questions[7].check = function () {
	if (this.given == null) return '';
	var me = this.given.value - 0;

	var that = Questions[8];
	if (that.given == null) {
	    var gap = 5 - me;
	    var lo = me - gap;
	    var hi = me + gap;
	    return ((lo < 1 || that.ans[lo].disabled) &&
		    (hi > 5 || that.ans[hi].disabled))
		? 'dodgy' : 'maybe';
	}
	var it = that.given.value - 0;
	var gap = (it > me) ? (it - me) : (me - it);
	return  (this.ans[5 - gap] == this.given) ? 'right' : 'wrong';
    };

    Questions[9].check = function () {
	if (this.given == null) return '';
	var me = this.given.value - 0;
	var yes = 'right';

	var that = Questions[9+me];
	if (that.given == null)
	    yes = (that.ans[me].disabled) ? 'dodgy' : 'maybe';

	else if (that.given != that.ans[me])
	    return 'wrong';

	for (var it = 9 + me; it-- > 10;)
	    if (Questions[it].ans[me].checked)
		return 'wrong';

	return yes;
    };

    Questions[12].check = function () {
	var test =
	[,
	 function (i) { return (i % 2) == 0; },
	 function (i) { return (i % 2) == 1; },
	 function (i) { return (i == 0 || i == 1 || i == 4 || i == 9 || i == 16); },
	 function (i) { return (i == 2 || i == 3 || i == 5 || i == 7 ||
				i == 11 || i == 13 || i == 17 || i == 19); },
	 function (i) { return (i % 5) == 0; }
	 ];
	var yes = 0;
	var maybe = 0;
	for (var i in Questions) {
	    var Q = Questions[i];
	    if (Q.ans[2].checked || Q.ans[3].checked || Q.ans[4].checked)
		yes++;
	    else if (Q.given == null &&
		     !(Q.ans[2].disabled && Q.ans[3].disabled && Q.ans[4].disabled)) {
		if (Q.ans[1].disabled && Q.ans[5].disabled)
		    yes++;
		else
		    maybe++;
	    }
	}

	if (this.given == null) {
	    var ok = 0;
	    var but = 0;
	    for (var j = 0; j++ < 5; ) {
		var f = test[j];
		var hit = 0;
		for (var i = yes + maybe; i >= yes; i--)
		    if (f(i)) hit++;

		if (hit)
		    if (this.ans[j].disabled) but++;
		    else ok++;
	    }
	    return (ok) ? '' : (but) ? 'dodgy' : 'wrong';
	} else {
	    var f = test[this.given.value];

	    for (var i = yes + maybe; i >= yes; i--)
		if (f(i)) return (maybe) ? 'maybe' : 'right';

	    return 'wrong';
	}
    };

    Questions[13].check = function () {
	var me = null, lo = null;
	if (this.given != null) {
	    me = this.given.value - 0;
	    lo = 2 * me + 7;
	    var that = Questions[lo];
	    if (!that.ans[1].checked && that.given != null)
		return 'wrong';
	}

	var maybe = 0;
	var dodgy = 0;
	for (var i = 1; i < 20; i += 2) { // we only want the odd ones
	    var that = Questions[i];
	    if (that.ans[1].checked) {
		if ((lo != null && lo != i) || i < 9 || i > 17)
		    return 'wrong';
		lo = i;
	    } else if (that.given == null && !that.ans[1].disabled) {
		if (i < 9 || i > 17)
		    dodgy++;
		else
		    maybe++;
	    }
	}
	return (lo == null && maybe == 0) ? 'wrong' : (this.given == null) ? ''
		// assert: lo is not null (since then given would be, too)
		: (Questions[lo].ans[1].disabled) ? 'dodgy'
		: maybe ? 'maybe' : 'right';
    };

    Questions[19].check = function () {
	return (this.given == null) ? '' : 'right';
    };

    Questions[20].check = function (flag) {
	var bad = 0;
	var miss = 0;
	var dodgy = 0;
	for (var i in Questions) {
	    var Q = Questions[i];
	    if (Q.given == null) miss++;
	    if (i != 20) {
		if (this.checking.checked || flag)
		    Q.setState(Q.check());
		if (Q.li.className == 'wrong') bad++;
		else if (Q.li.className != 'right') dodgy++;
	    }
	}
	return bad ? 'wrong' : miss == 0 ? 'right' : dodgy ? 'dodgy' : 'maybe';
    };
}
