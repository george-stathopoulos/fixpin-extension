// Runs in the page: remembers errors that happen after Spotlight was started.
( function () {
	if ( window.__fixpassErrors ) {
		return;
	}
	var list = ( window.__fixpassErrors = [] );
	var add = function ( type, msg ) {
		if ( list.length < 30 ) {
			list.push( { type: type, msg: String( msg ).slice( 0, 600 ) } );
		}
	};
	window.addEventListener( 'error', function ( e ) {
		if ( e.target && e.target !== window && ( e.target.src || e.target.href ) ) {
			add( 'resource', 'Failed to load ' + ( e.target.src || e.target.href ) );
		} else {
			add( 'error', ( e.message || 'Error' ) + ( e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : '' ) );
		}
	}, true );
	window.addEventListener( 'unhandledrejection', function ( e ) {
		add( 'promise', ( e.reason && e.reason.message ) || e.reason );
	} );
	[ 'error', 'warn' ].forEach( function ( lvl ) {
		var orig = console[ lvl ];
		console[ lvl ] = function () {
			add( lvl, Array.prototype.map.call( arguments, String ).join( ' ' ) );
			return orig.apply( console, arguments );
		};
	} );
	var f = window.fetch;
	if ( f ) {
		window.fetch = function () {
			var a = arguments;
			return f.apply( this, a ).then( function ( r ) {
				if ( ! r.ok ) {
					add( 'network', r.status + ' ' + String( ( a[ 0 ] && a[ 0 ].url ) || a[ 0 ] ).slice( 0, 300 ) );
				}
				return r;
			}, function ( e ) {
				add( 'network', 'Failed ' + String( ( a[ 0 ] && a[ 0 ].url ) || a[ 0 ] ).slice( 0, 300 ) );
				throw e;
			} );
		};
	}
} )();
