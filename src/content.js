// FixPin Spotlight overlay: click an element or drag a box, add a note, send.
( function () {
	'use strict';
	if ( window.__fixpinActive ) {
		return;
	}
	window.__fixpinActive = true;
	var api = globalThis.browser || globalThis.chrome;
	var MARK = 'fxp-ext-ui';
	var spots = [];
	var host = document.createElement( 'div' );
	host.className = MARK;
	host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;cursor:crosshair';
	var root = host.attachShadow( { mode: 'closed' } );
	root.innerHTML =
		'<style>*{box-sizing:border-box;font:14px/1.4 system-ui,sans-serif}' +
		'.hint{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1b1f2a;color:#fff;padding:10px 16px;border-radius:10px;box-shadow:0 4px 20px #0006;pointer-events:none}' +
		'.box{position:fixed;border:3px solid #e03131;background:rgba(224,49,49,.14);border-radius:4px;pointer-events:none}' +
		'.box b{position:absolute;top:-1px;left:-1px;background:#e03131;color:#fff;font:700 12px/1 system-ui;padding:4px 6px}' +
		'.panel{position:fixed;right:16px;bottom:16px;width:320px;background:#fff;color:#1b1f2a;border-radius:12px;padding:14px;box-shadow:0 8px 30px #0006;cursor:default}' +
		'textarea,select,input{width:100%;margin:4px 0 8px;padding:8px;border:1px solid #c5cad6;border-radius:8px}' +
		'button{padding:8px 14px;border-radius:8px;border:1px solid #c5cad6;background:#fff;cursor:pointer}' +
		'button.p{background:#3b5bdb;border-color:#3b5bdb;color:#fff;font-weight:600}' +
		'button:focus-visible,textarea:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #3b5bdb;outline-offset:2px}' +
		'.row{display:flex;gap:8px}.row>*{min-width:0}select{width:45%}.err{color:#c92a2a}small{color:#5b6475}</style>' +
		'<div class="hint" id="hint">Click the problem or drag a box around it (Esc to cancel)</div>' +
		'<div id="boxes"></div><div class="panel" id="panel" hidden>' +
		'<strong id="count"></strong><textarea id="note" rows="3" maxlength="4000" placeholder="What is wrong? (optional)"></textarea>' +
		'<div class="row"><select id="days"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option></select>' +
		'<input id="pass" placeholder="Passcode (optional)" maxlength="60" autocomplete="off"></div>' +
		'<small>Sent to FixPin and deleted when the link expires. Hide anything private first.</small>' +
		'<div class="row" style="margin-top:8px"><button id="cancel">Cancel</button><button id="send" class="p">Send</button></div>' +
		'<p class="err" id="err" hidden></p></div>';
	document.documentElement.appendChild( host );
	var $ = function ( id ) { return root.getElementById( id ); };

	function cleanup() {
		window.removeEventListener( 'keydown', onKey, true );
		host.remove();
		window.__fixpinActive = false;
	}
	function onKey( e ) {
		if ( e.key === 'Escape' ) {
			cleanup();
		}
	}
	window.addEventListener( 'keydown', onKey, true );

	function selectorFor( el ) {
		var parts = [];
		while ( el && el.nodeType === 1 && el !== document.body && parts.length < 5 ) {
			if ( el.id && /^[A-Za-z][\w-]*$/.test( el.id ) ) {
				parts.unshift( '#' + el.id );
				break;
			}
			var c = ( el.getAttribute( 'class' ) || '' ).split( /\s+/ ).filter( function ( x ) { return /^[A-Za-z][\w-]*$/.test( x ) && ! /\d{3,}/.test( x ); } ).slice( 0, 2 );
			parts.unshift( el.tagName.toLowerCase() + ( c.length ? '.' + c.join( '.' ) : '' ) );
			el = el.parentElement;
		}
		return parts.join( ' > ' );
	}

	function redraw() {
		var b = $( 'boxes' );
		b.textContent = '';
		spots.forEach( function ( s, i ) {
			var d = document.createElement( 'div' );
			d.className = 'box';
			d.style.cssText = 'left:' + s.px.x + 'px;top:' + s.px.y + 'px;width:' + s.px.w + 'px;height:' + s.px.h + 'px';
			var n = document.createElement( 'b' );
			n.textContent = i + 1;
			d.appendChild( n );
			b.appendChild( d );
		} );
		// Keep the panel on the side of the page that has no spots, so it never covers one.
		var mid = spots.reduce( function ( t, s ) { return t + s.px.x + s.px.w / 2; }, 0 ) / ( spots.length || 1 );
		var panel = $( 'panel' );
		panel.style.left = mid > innerWidth / 2 ? '16px' : 'auto';
		panel.style.right = mid > innerWidth / 2 ? 'auto' : '16px';
		panel.hidden = ! spots.length;
		$( 'count' ).textContent = spots.length + ' spot' + ( spots.length === 1 ? '' : 's' ) + ' marked. Click again to add more (up to 5).';
	}

	var start = null;
	host.addEventListener( 'mousedown', function ( e ) {
		if ( e.composedPath()[ 0 ] !== host ) {
			return;
		}
		start = { x: e.clientX, y: e.clientY };
	} );
	host.addEventListener( 'mouseup', function ( e ) {
		if ( ! start || e.composedPath()[ 0 ] !== host || spots.length >= 5 ) {
			start = null;
			return;
		}
		var x = Math.min( start.x, e.clientX ), y = Math.min( start.y, e.clientY );
		var w = Math.abs( e.clientX - start.x ), h = Math.abs( e.clientY - start.y );
		var cx = e.clientX, cy = e.clientY;
		start = null;
		var el;
		host.style.pointerEvents = 'none';
		el = document.elementFromPoint( w < 5 && h < 5 ? cx : x + w / 2, w < 5 && h < 5 ? cy : y + h / 2 );
		host.style.pointerEvents = '';
		if ( w < 5 && h < 5 && el ) {
			var r = el.getBoundingClientRect();
			x = Math.max( 0, r.left ); y = Math.max( 0, r.top ); w = Math.min( r.width, innerWidth ); h = Math.min( r.height, innerHeight );
		}
		spots.push( { px: { x: x, y: y, w: w, h: h }, selector: el ? selectorFor( el ) : '' } );
		$( 'hint' ).hidden = true;
		redraw();
	} );

	$( 'cancel' ).onclick = cleanup;
	$( 'send' ).onclick = function () {
		var err = $( 'err' );
		err.hidden = true;
		$( 'send' ).disabled = true;
		// Hide our overlay for the screenshot, then show the marks again.
		host.style.visibility = 'hidden';
		setTimeout( function () {
			api.runtime.sendMessage( { type: 'capture' } ).then( function ( cap ) {
				host.style.visibility = '';
				if ( ! cap || cap.error ) {
					throw new Error( ( cap && cap.error ) || 'Could not take the screenshot.' );
				}
				return api.runtime.sendMessage( { type: 'send', payload: {
					url: location.href, title: document.title, note: $( 'note' ).value.trim(), ua: navigator.userAgent,
					viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio || 1 },
					screenshot: cap.dataUrl, days: Number( $( 'days' ).value ), passcode: $( 'pass' ).value.trim() || undefined,
					spots: spots.map( function ( s ) {
						return { x: s.px.x / innerWidth, y: s.px.y / innerHeight, w: s.px.w / innerWidth, h: s.px.h / innerHeight, selector: s.selector, note: '' };
					} ),
				} } );
			} ).then( function ( res ) {
				if ( ! res || res.error ) {
					throw new Error( ( res && res.error ) || 'Could not send the report.' );
				}
				$( 'panel' ).innerHTML = '<strong>Your link is ready</strong><input id="link" readonly><div class="row"><button id="copy" class="p">Copy link</button><button id="close">Close</button></div><small>Expires ' + new Date( res.expiresAt ).toLocaleString() + '.</small>';
				$( 'link' ).value = res.link;
				navigator.clipboard.writeText( res.link ).catch( function () {} );
				$( 'copy' ).onclick = function () { navigator.clipboard.writeText( res.link ); $( 'copy' ).textContent = 'Copied'; };
				$( 'close' ).onclick = cleanup;
			} ).catch( function ( e ) {
				host.style.visibility = '';
				$( 'send' ).disabled = false;
				err.textContent = e.message;
				err.hidden = false;
			} );
		}, 150 );
	};
} )();
