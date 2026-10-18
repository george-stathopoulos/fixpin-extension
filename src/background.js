// FixSpot extension background: starts Spotlight on the active tab, takes the screenshot
// and sends the report to the FixSpot server. Nothing is sent until you press Send.
import { DEFAULT_SERVER } from './config.js';
const api = globalThis.browser || globalThis.chrome;

const serverUrl = async () => ( await api.storage.local.get( 'server' ) ).server || DEFAULT_SERVER;

async function start( tabId ) {
	try {
		// Error collector runs in the page itself; the overlay in the extension's own world.
		await api.scripting.executeScript( { target: { tabId }, files: [ 'src/hook.js' ], world: 'MAIN' } );
		await api.scripting.executeScript( { target: { tabId }, files: [ 'src/content.js' ] } );
		return {};
	} catch {
		return { error: 'FixSpot cannot run on this page (browser pages and the extension store are off limits).' };
	}
}

async function pageErrors( tabId ) {
	try {
		const [ r ] = await api.scripting.executeScript( { target: { tabId }, world: 'MAIN', func: () => window.__fixspotErrors || [] } );
		return r.result || [];
	} catch {
		return [];
	}
}

async function send( tab, payload ) {
	payload.errors = await pageErrors( tab.id );
	const base = await serverUrl();
	const res = await fetch( base + '/api/reports', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify( payload ),
	} );
	const out = await res.json().catch( () => ( {} ) );
	if ( ! res.ok ) {
		throw new Error( out.error || 'The server said no (' + res.status + ').' );
	}
	return { link: base + '/r/' + out.id, expiresAt: out.expiresAt };
}

api.runtime.onMessage.addListener( ( msg, sender, reply ) => {
	if ( msg.type === 'start' ) {
		start( msg.tabId ).then( reply );
		return true;
	}
	if ( msg.type === 'capture' ) {
		api.tabs.captureVisibleTab( sender.tab.windowId, { format: 'jpeg', quality: 80 } ).then(
			( dataUrl ) => reply( { dataUrl } ),
			( e ) => reply( { error: String( e.message || e ) } )
		);
		return true;
	}
	if ( msg.type === 'send' ) {
		send( sender.tab, msg.payload ).then( reply, ( e ) => reply( { error: e.message } ) );
		return true;
	}
	return false;
} );
