import { DEFAULT_SERVER } from './config.js';
const api = globalThis.browser || globalThis.chrome;
const $ = ( id ) => document.getElementById( id );

api.storage.local.get( 'server' ).then( ( { server } ) => ( $( 'server' ).value = server || DEFAULT_SERVER ) );
$( 'save' ).onclick = async () => {
	try {
		const u = new URL( $( 'server' ).value );
		if ( u.protocol !== 'https:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1' ) {
			throw new Error();
		}
		await api.storage.local.set( { server: u.origin } );
		$( 'msg' ).textContent = 'Saved.';
	} catch {
		$( 'msg' ).textContent = 'Enter a full https:// address.';
	}
};
$( 'reset' ).onclick = async () => {
	await api.storage.local.remove( 'server' );
	$( 'server' ).value = DEFAULT_SERVER;
};
$( 'go' ).onclick = async () => {
	const [ tab ] = await api.tabs.query( { active: true, currentWindow: true } );
	const res = await api.runtime.sendMessage( { type: 'start', tabId: tab.id } );
	if ( res && res.error ) {
		$( 'msg' ).textContent = res.error;
	} else {
		window.close();
	}
};
