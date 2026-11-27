import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { execSync } from 'child_process'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROTO_PATH = process.env.PROTO_PATH || path.resolve(process.cwd(), '../backend/proto/music.proto');
const BACKEND_ADDR = process.env.BACKEND_ADDR || 'localhost:50051';

let musicClient;
function getClient() {
	if (musicClient) return musicClient;
	const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true,
	});
	const proto = grpc.loadPackageDefinition(packageDefinition);
	const music = proto['music']?.v1;
	if (!music || !music.MusicService) {
		throw new Error('Failed to load music.v1.MusicService from proto');
	}
	musicClient = new music.MusicService(BACKEND_ADDR, grpc.credentials.createInsecure());
	return musicClient;
}

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id') || 'kawaikute-gomen.mp3';
	const listenerName = searchParams.get('name') || 'Anonymous';

	const realID = execSync(`echo kawaikute-gomen.mp3 | sha256sum`).toString().trim();
	const userID = execSync(`echo ${id} | sha256sum`).toString().trim();

	if (userID !== realID) {
		return new Response('invalid id', { status: 400 });
	}

	try {
		const client = getClient();

		let call;
		const stream = new ReadableStream({
			start(controller) {
				call = client.StreamTrack({ id, listener_name: listenerName });

				const abort = () => {
					try { call.cancel(); } catch (_) {}
					try { controller.close(); } catch (_) {}
				};
				request.signal.addEventListener('abort', abort);

				call.on('data', (chunk) => {
					if (chunk && chunk.data) {
						try {
							controller.enqueue(Buffer.from(chunk.data));
						} catch (_) {}
					}
				});
				call.on('end', () => {
					try { controller.close(); } catch (_) {}
				});
				call.on('error', () => {
					try { controller.close(); } catch (_) {}
				});
			},
			cancel() {
				try { call?.cancel(); } catch (_) {}
			},
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cache-Control': 'no-store',
			},
		});
	} catch (err) {
		return new Response('failed to start stream', { status: 500 });
	}
}


